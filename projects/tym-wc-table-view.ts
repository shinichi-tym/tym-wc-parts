/*!
 * tym-wc-table-view.js
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
 * create a class for the tym-wc-table-view element
 */
export class TymWcTableView extends HTMLElement {

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
   * 初期化
   */
  private __init(shadow: ShadowRoot): void {
    /////////////////////////////////////////////////////////////////
    // make style sheets
    this.__styles = [[this.rightCols, 'right'], [this.centerCols, 'center']]
      .map(a =>
        css`${(a[0] as string[])
          .reduce((r, col) => r + `tbody tr td:nth-child(${col}){text-align:${a[1]}}`, '')}`);
    this.__styles.unshift(TymWcTableView.styles);
    /////////////////////////////////////////////////////////////////
    // make style sheets
    if (isCSSSS) {
      //@ts-ignore : set style sheets
      shadow.adoptedStyleSheets = this.__styles;
    }
  }

  ///////////////////////////////////////////////////////////////////
  /**
   * 描画する
   */
  private __render(): void {
    const shadow = this.shadowRoot as ShadowRoot;
    /////////////////////////////////////////////////////////////////
    // init
    this.__init(shadow);
    /////////////////////////////////////////////////////////////////
    // make html
    const tx = this.__makehtml();
    /////////////////////////////////////////////////////////////////
    // remove old elements
    while (shadow.firstChild) shadow.removeChild(shadow.firstChild);
    /////////////////////////////////////////////////////////////////
    // make style sheets
    if (!isCSSSS) {
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
customElements.define('tym-wc-table-view', TymWcTableView);
