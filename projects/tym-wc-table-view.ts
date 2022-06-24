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
  css: (t: TemplateStringsArray, ...v: any[]) => { const c = new CSSStyleSheet(); c.replaceSync(_.htm(t, v)); return c },
  // cst: (t: TemplateStringsArray, ...v: any[]) => Array.from(_.css(t, v).cssRules).reduce((r, c) => r + c.cssText, ''),
  cst: (t: TemplateStringsArray, ...v: any[]) => _.htm(t, v),
  htm: (t: TemplateStringsArray, ...v: any[]) => v.reduce((r, s, i) => r + _.sss(t[i]) + s, '') + _.sss(t.slice(-1)[0]),
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
    const shadow = this.attachShadow({ mode: 'open' });
    // this.__init(this.attachShadow({ mode: 'open' }));
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
  private __props = {
    cols: Array<string>(),
    lastSp: true,
    maxWidth: 200,
    rightCols: Array<string>(),
    centerCols: Array<string>(),
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
    const FIRST_ELM_CHILD = (elm: HTMLElement) => elm.firstElementChild;
    const { maxWidth, lastSp } = this.__props;
    const shadow = this.shadowRoot as ShadowRoot;
    const tableElm = shadow.querySelector('table') as HTMLTableElement; // table
    if (!tableElm) return;
    const theadElm = FIRST_ELM_CHILD(tableElm) as HTMLTableSectionElement; // thead
    const theadTrElm = FIRST_ELM_CHILD(theadElm) as HTMLTableRowElement; // tr
    const theadTrLastThElm = theadTrElm.lastElementChild as HTMLElement; // last th
    const thElms = theadTrElm.querySelectorAll('th');
    tableElm.style.width = '';
    thElms.forEach(th => (th.style.width = ''));
    thElms.forEach(th => {
      th.style.width =
        th.clientWidth > maxWidth
          ? `${maxWidth}px`
          : window.getComputedStyle(th).width;
    });
    tableElm.style.width = lastSp ? ((theadTrLastThElm.style.width = ''), '100%') : '';
  }

  ///////////////////////////////////////////////////////////////////
  /**
   * 描画用にcolsおよびdataを作成する
   * @returns [cols:string[], data:string[][]]
   */
  private __makedata(): [string[], string[][]] {
    /////////////////////////////////////////////////////////////////
    // make cols and data from textContent,this.cols
    const { cols } = this.__props;
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
      return [[], []]
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
    const [lastspth, lastsptd] = this.__props.lastSp
      ? [`<th class="lastsp"></th>`, `<td class="lastsp"></td>`]
      : [``, ``];
    const _html = html`
      <table>
        <thead>
          <tr>
            ${_cols.reduce((r, col) =>
              r + `<th title="${col}">${col}</th>`, '')}${lastspth}
          </tr>
        </thead>
        <tbody>
          ${_data.reduce((r, row) =>
            r + `<tr>${row.reduce((r, col) =>
              r + `<td title="${col}">${col}</td>`, '')}${lastsptd}</tr>`, '')}
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
    // set attributes to variable
    const attrs = this.attributes;
    const cnv = {
      array: (x: string) => x.split(','),
      boolean: (x: string) => x == 'true',
      number: (x: string) => parseInt(x),
    }
    const props = this.__props;
    Object.keys(props).forEach(name => {
      const [name1, name2] = [name.toLowerCase(), name.replace(/([A-Z])/g, '-$1').toLowerCase()];
      const attr = attrs.getNamedItem(name1) || attrs.getNamedItem(name2);
      //@ts-ignore
      props[name] = (v => (attr) ? (t => (cnv[t]) ? cnv[t](attr.value) : v)(_.typ(v)) : v)(props[name]);
    });
    /////////////////////////////////////////////////////////////////
    // make style sheets
    this.__styles = [[props.rightCols, 'right'], [props.centerCols, 'center']]
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
    shadow.childNodes.forEach(node=>node.remove());
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
