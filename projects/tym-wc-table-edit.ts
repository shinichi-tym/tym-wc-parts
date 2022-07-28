/*!
 * tym-wc-table-edit.js
 * Copyright (c) 2022 shinichi tayama
 * Released under the MIT license.
 * see https://opensource.org/licenses/MIT
 */

/////////////////////////////////////////////////////////////////////
/**
 * utility class
 */
const _ = {
  sss: (t: string) => t.split(/\r\n|\n/).reduce((r, s) => r + s.trim(), ''),
  typ: (t: any) => Object.prototype.toString.call(t).slice(8, -1).toLowerCase(),
  //@ts-ignore
  css: (t: TemplateStringsArray, ...v: any[]) => { const c = new CSSStyleSheet(); c.replaceSync(_.htm(t, ...v)); return c },
  // cst: (t: TemplateStringsArray, ...v: any[]) => Array.from(_.css(t, v).cssRules).reduce((r, c) => r + c.cssText, ''),
  cst: (t: TemplateStringsArray, ...v: any[]) => _.htm(t, ...v),
  htm: (t: TemplateStringsArray, ...v: any[]) => (v.push(''), t.reduce((r, s, i) => r + _.sss(s) + v[i], '')),
}

/////////////////////////////////////////////////////////////////////
const isCSSSS = !!CSSStyleSheet;
const [css, html] = [isCSSSS ? _.css : _.cst, _.htm];

/////////////////////////////////////////////////////////////////////
/**
 * create a class for the tym-wc-table-edit element
 */
export class TymWcTableEdit extends HTMLElement {

  ///////////////////////////////////////////////////////////////////
  // constructor
  constructor() {
    // console.log('>> constructor.');
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // console.log('>> added to page.');
    this.__render();
  }

  // disconnectedCallback() {
  //   console.log('>> removed from page.');
  // }

  // adoptedCallback() {
  //   console.log('>> moved to new page.');
  // }

  // static get observedAttributes() { return [] }
  // attributeChangedCallback(name: string, oldValue: any, newValue: any) {
  //   console.log('>> attributes changed.', name, oldValue, newValue);
  // }

  ///////////////////////////////////////////////////////////////////
  /**
   * プロパティ
   */

  /** カラムヘッダーを csv 形式で指定 */
  get cols(): string[] { const v = this.getAttribute('cols'); return (v) ? v.split(',') : [] }
  set cols(v: string | Array<string>) {
    this.setAttribute('cols', (typeof v === 'object') ? v.join(',') : v)
  }

  /** 最終カラムを追加するか否かを指定 (default:true) */
  get lastSp() { return this.getAttribute('last-sp') == 'true' }
  set lastSp(value: string | boolean) { this.setAttribute('last-sp', value.toString()) }

  /** セル幅が大きい場合の最大セル幅を指定 (default:200) */
  get maxWidth() { return parseInt(this.getAttribute('max-width') || '200') }
  set maxWidth(value: string | number) { this.setAttribute('max-width', value.toString()) }

  /** 右揃えカラムの番号を csv 形式で指定, nth-child(${value}) */
  get rightCols() { const v = this.getAttribute('right-cols'); return (v) ? v.split(',') : [] }
  set rightCols(value: string | Array<string | number>) {
    this.setAttribute('right-cols', (typeof value === 'object') ? value.join(',') : value)
  }

  /** 中央揃えカラムの番号を csv 形式で指定, nth-child(${value}) */
  get centerCols() { const v = this.getAttribute('center-cols'); return (v) ? v.split(',') : [] }
  set centerCols(value: string | Array<string | number>) {
    this.setAttribute('center-cols', (typeof value === 'object') ? value.join(',') : value)
  }

  ///////////////////////////////////////////////////////////////////
  /**
   * スタイル
   */
  private __styles: (string | CSSStyleSheet)[] = [];

  ///////////////////////////////////////////////////////////////////
  /**
   * セル幅を調整する
   */
  private __resize(): void {
    const FEC = (elm: HTMLElement) => elm.firstElementChild;
    const { maxWidth, lastSp } = this;
    const shadow = this.shadowRoot as ShadowRoot;
    const tblElm = shadow.querySelector('table') as HTMLTableElement; // table
    if (!tblElm) return;
    const thdElm = FEC(tblElm) as HTMLTableSectionElement; // thead
    const thdTrElm = FEC(thdElm) as HTMLTableRowElement; // tr
    const thdTrLstThElm = thdTrElm.lastElementChild as HTMLElement; // last th
    const thElms = thdTrElm.querySelectorAll('th');
    tblElm.style.width = '';
    thElms.forEach(th => (th.style.width = ''));
    thElms.forEach(th => {
      th.style.width =
        th.clientWidth > maxWidth
          ? `${maxWidth}px`
          : window.getComputedStyle(th).width;
    });
    tblElm.style.width = lastSp ? ((thdTrLstThElm.style.width = ''), '100%') : '';
  }

  ///////////////////////////////////////////////////////////////////
  /**
   * 描画用にcolsおよびdataを作成する
   * @returns [cols:string[], data:string[][]]
   */
  private __makedata(): [string[], string[][]] {
    /////////////////////////////////////////////////////////////////
    // make cols and data from textContent,this.cols
    const cols = this.cols;
    const txt = (this.textContent || '').trim();
    if (cols?.length <= 0 && txt.length <= 0) {
      const observer = new MutationObserver(() => {
        const txt = (this.textContent || '').trim();
        if (txt.length > 0) {
          this.__render();
          observer.disconnect();
        }
      });
      observer.observe(this, { childList: true, characterData: true });
      return [[], []];
    }
    let data: string[][] = [];
    txt.split(/\r\n|\n/)
      .forEach(row => data.push(row.split(',').map(v => v.trim())));
    let __cols =
      !cols || cols.length <= 0
        ? (data.shift() as string[])
        : cols;
    const colmax = Math.max(
      __cols.length,
      data.reduce((a, b) => (a.length > b.length ? a : b)).length
    );
    /////////////////////////////////////////////////////////////////
    // make _cols and _data (empty cell fill by '')
    let _cols = Array<string>(colmax).fill('');
    __cols.forEach((col, i) => (_cols[i] = col));
    let _data: string[][] = new Array(data.length);
    for (let index = 0; index < data.length; index++) {
      _data[index] = new Array(colmax).fill('');
    }
    data.forEach((row, i) => {
      row.forEach((col, j) => (_data[i][j] = col));
    });
    this.textContent = '';
    return [_cols, _data];
  }

  ///////////////////////////////////////////////////////////////////
  /**
   * 描画用にhtmlを作成する
   * @returns html string
   */
  private __makehtml(): string {
    const [_cols, _data] = this.__makedata();
    const [lastspTh, lastspTd] = this.lastSp
      ? [`<th class="lastsp"></th>`, `<td class="lastsp"></td>`]
      : [``, ``];
    const _html = html`
      <table>
        <thead>
          <tr>
            ${_cols.reduce((r, col) =>
              r + `<th title="${col}">${col}</th>`, '')}${lastspTh}
          </tr>
        </thead>
        <tbody>
          ${_data.reduce((r, row) =>
            r + `<tr>${row.reduce((r, col) =>
              r + `<td title="${col}">${col}</td>`, '')}${lastspTd}</tr>`, '')}
        </tbody>
      </table>
    `;
    return _html;
  }

  ///////////////////////////////////////////////////////////////////
  /**
   * 描画する
   */
  private __render(): void {
    const shadow = this.shadowRoot as ShadowRoot;
    /////////////////////////////////////////////////////////////////
    // make html
    const tx = this.__makehtml();
    /////////////////////////////////////////////////////////////////
    // remove old elements
    while (shadow.firstChild) shadow.removeChild(shadow.firstChild);
    /////////////////////////////////////////////////////////////////
    // make style sheets
    this.__styles = [[this.rightCols, 'right'], [this.centerCols, 'center']]
      .map(a =>
        css`${(a[0] as string[])
          .reduce((r, col) => r + `tbody tr td:nth-child(${col}){text-align:${a[1]}}`, '')}`);
    this.__styles.unshift(TymWcTableEdit.styles);
    if (isCSSSS) {
      //@ts-ignore : set style sheets
      shadow.adoptedStyleSheets = this.__styles;
    } else {
      const styleElm = document.createElement('style');
      styleElm.innerText = (this.__styles as string[]).reduce((r, c) => r + c, '');
      shadow.appendChild(styleElm);
    }
    /////////////////////////////////////////////////////////////////
    // make dom
    const dom = new DOMParser().parseFromString(tx, 'text/html');
    dom.body.childNodes.forEach(node => shadow.appendChild(node.cloneNode(true)));
    /////////////////////////////////////////////////////////////////
    // resize
    this.__resize();
    this.__edit_func(shadow);
  }

  private __edit_func(shadow: ShadowRoot): void {
    //---------------------------------------------------------------
    // ..
    const table = shadow.firstElementChild as HTMLTableElement;
    const thead = table.firstElementChild as HTMLTableSectionElement;
    const tbody = table.lastElementChild as HTMLTableSectionElement;
    if (tbody.childElementCount == 0) return;
    const theadRowNum = thead.childElementCount;
    const maxrow = tbody.children.length - 1;
    const maxcol = tbody.children[0].children.length - 1;
    //---------------------------------------------------------------
    // ..
    let editElm = null as HTMLTableCellElement | null; // edited td cell
    let crntElm = tbody.children[0].children[0] as HTMLTableCellElement; // current td cell
    //---------------------------------------------------------------
    // ..
    const cell = (r: number, c: number) => tbody.children[r]?.children[c] as HTMLTableCellElement;
    const cellRowCol = (td: HTMLTableCellElement | null) =>
      (td) ? [(td.parentElement as HTMLTableRowElement).rowIndex - theadRowNum, td.cellIndex] : [0, 0];
    const classlist = (elm: HTMLElement) => elm.classList;
    const classrm = (elm: HTMLElement, cls: string) => classlist(elm).remove(cls);
    const classadd = (elm: HTMLElement, cls: string) => classlist(elm).add(cls);
    /****************************************************************
     * set current element (crntElm, style)
     * @param elm 対象エレメント
     */
    const setCurrent = (elm: HTMLTableCellElement) => {
      const crn = 'crn';
      classrm(crntElm, crn);
      classadd(elm, crn);
      crntElm = elm;
    }
    //---------------------------------------------------------------
    // set tab index
    tbody.childNodes.forEach(tr =>
      tr.childNodes.forEach(td => (td as HTMLTableCellElement).tabIndex = -1));
    setCurrent(cell(0, 0));
    /****************************************************************
     * mouse down event
     * @param e MouseEvent
     */
    const event_mousedown = (e: MouseEvent) => {
      let td = e.target as HTMLTableCellElement;
      if (e.detail == 1) {
        setCurrent(td);
      } if (e.detail == 2) {
        toEdit(td);
        e.preventDefault();
      }
    }
    tbody.addEventListener('mousedown', event_mousedown);
    /****************************************************************
     * keypress event
     * @param e KeyboardEvent
     */
    const event_keypress = (e: KeyboardEvent) => {
      const td = e.target as HTMLTableCellElement;
      if (!editElm) {
        toEdit(td);
      }
    }
    tbody.addEventListener('keypress', event_keypress);
    /****************************************************************
     * key down event
     * @param e KeyboardEvent
     */
    const event_keydown = (e: KeyboardEvent) => {
      const thisCell = e.target as HTMLTableCellElement;
      const [thisRowIx, thisColIx] = cellRowCol(thisCell);
      //-------------------------------------------------------------
      /** 矢印によるフォーカスの上下左右移動                       */
      const arrow = (rowcol: number[]) => {
        const td = cell(rowcol[0], rowcol[1]);
        td.blur();
        td.focus();
        setCurrent(td);
      }
      const arrowmove = (isUpDown: boolean, isUpOrLeft: boolean) => {
        const [A, B, C] = (isUpDown)
          ? (isUpOrLeft) ? [(thisRowIx > 0), -1, 0] : [(thisRowIx < maxrow), 1, 0]
          : (isUpOrLeft) ? [(thisColIx > 0), 0, -1] : [(thisColIx < maxcol), 0, 1];
        arrow(A ? [thisRowIx + B, thisColIx + C] : [thisRowIx, thisColIx]);
      }
      //-------------------------------------------------------------
      const eKey = e.key + ((!!editElm && (e.key != 'Tab' && e.key != 'Enter')) ? '_EDIT' : '');
      const keya = new Map<string, Function>([
        ['ArrowDown', () => arrowmove(true, false)],
        ['ArrowUp', () => arrowmove(true, true)],
        ['ArrowRight', () => arrowmove(false, false)],
        ['ArrowLeft', () => arrowmove(false, true)],
        ['Tab', () => arrowmove(false, e.shiftKey)],
        ['Enter', () => arrowmove(true, e.shiftKey)],
        ['Home', () => arrow(e.ctrlKey ? [0, 0] : [thisRowIx, 0])],
        ['End', () => arrow(e.ctrlKey ? [maxrow, maxcol] : [thisRowIx, maxcol])],
        ['F2', () => toEdit(thisCell)],
        ['Backspace', () => (toEdit(thisCell), thisCell.innerText = '')],
        ['Delete', () => thisCell.innerText = ''],
        ['Escape_EDIT', () => {
          thisCell.innerText = beforeValue!;
          thisCell.blur();
          thisCell.focus();
        }],
      ]);
      const keyp = keya.get(eKey);
      if (keyp) {
        keyp();
        e.preventDefault();
      }
    }
    tbody.addEventListener('keydown', event_keydown);
    /****************************************************************
     * Escapeキー戻値用
     */
    let beforeValue: string | null;

    /****************************************************************
     * フォーカスアウトイベント処理，表示モードにする
     */
    const editBlue = () => {
      if (editElm) {
        editElm.removeEventListener('blur', editBlue);
        editElm.removeAttribute('contentEditable');
      }
      beforeValue = null;
      editElm = null;
    }

    /****************************************************************
     * 対象セルを編集モードにする
     * @param td 対象エレメント
     */
    const toEdit = (td: HTMLTableCellElement) => {
      beforeValue = td.innerText;
      td.contentEditable = 'true';
      td.addEventListener('blur', editBlue);
      const [sel, rng] = [window.getSelection(), document.createRange()];
      rng.selectNodeContents(td);
      sel?.removeAllRanges();
      sel?.addRange(rng)
      editElm = td;
    }
  }

  ///////////////////////////////////////////////////////////////////
  /**
   * 簡易テーブル表示 Web コンポーネント用スタイル
   */
  static styles = css`
    :host {
      display: block;
      width: fit-content;
      font-family: system-ui;
      font-variant-numeric: tabular-nums slashed-zero;
    }
    table {
      border-collapse: separate;
      border-spacing: 0;
      table-layout: fixed;
      overflow: hidden;
      border-radius: 3px;
      background-color: #f8f8f8;
    }
    thead tr {
      user-select: none;
    }
    thead tr th {
      position: -webkit-sticky;
      position: sticky;
      top: 0;
      z-index: 1;
      resize: horizontal;
      border-style: solid;
      border-width: 1px 1px 1px 0;
      background-color: #bbb;
    }
    thead tr th:first-child {
      border-left-width: 1px;
    }
    tbody tr {
      opacity: 0.8;
    }
    tbody tr:nth-child(even) {
      background-color: #eee;
    }
    tbody tr > * {
      border-style: solid;
      border-width: 0 1px 1px 0;
    }
    tbody tr > *:first-child {
      border-left-width: 1px;
    }
    tbody tr:hover {
      opacity: 1;
    }
    tbody .crn {
      outline: solid 2px #000;
      outline-offset: -2px;
    }
    tbody [contentEditable] {
      background-color: #bfc;
    }
    th,
    td {
      min-width: 4em;
      padding: 0.1em 0.6em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      box-sizing: border-box;
      border-color: #888;
    }
    .lastsp {
      width: auto;
      resize: none;
      opacity: 0.5;
    }
  `;

}

/////////////////////////////////////////////////////////////////////
/**
 * defind custom element
 */
customElements.define('tym-wc-table-edit', TymWcTableEdit);
