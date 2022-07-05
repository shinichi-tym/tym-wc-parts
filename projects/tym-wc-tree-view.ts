/*!
 * tym-wc-tree-view.js
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

/********************************************************************
tree = [
  'leaf-text',
  'leaf-text',
  [
    'leaf-text',
    'leaf-text',
  ],
  'leaf-text',
]
*********************************************************************/

type TREE = TREE[] | string;

type LEAF = {
  /** リーフに表示する文字 */
  tx: string;
  /** 子リーフの配列 */
  ix: string[];
}

/////////////////////////////////////////////////////////////////////
/**
 * 選択リーフからTOPまでのリーフ文字列の配列
 * @param leafs leaf data
 * @param index leaf index
 * @returns leaf string array
 */
const gettexts = (leafs: LEAF[], index: number): string[] => {
  let ret: string[] = [];
  let lvl = leafs[index].ix.length;
  ret.push(leafs[index].tx);
  for (let i = index - 1; i >= 0; i--) {
    if (leafs[i].ix.length < lvl) {
      lvl = leafs[i].ix.length;
      ret.push(leafs[i].tx);
    }
  }
  return ret.reverse();
}

/////////////////////////////////////////////////////////////////////
/**
 * create a class for the tym-wc-tree-view element
 */
export class TymWcTreeView extends HTMLElement {

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

  // static get observedAttributes() { return ['tree'] }
  // attributeChangedCallback(name: string, oldValue: any, newValue: any) {
  //   console.log('>> attributes changed.', name, oldValue, newValue);
  // }

  private __leafs!: LEAF[];

  ///////////////////////////////////////////////////////////////////
  /**
   * プロパティ
   */

  /** tree data を指定 (getter) */
  get tree() {
    let o;
    try {
      o = JSON.parse(this.getAttribute('tree') || '[]');
    } catch (error) {
      o = ['parse error!', (error instanceof Error) ? error.message : error];
    }
    return o;
  }

  /** tree data を指定 (setter) */
  set tree(value: any) {
    this.setAttribute('tree', (typeof value === 'object') ? JSON.stringify(value) : value);
    if (this.isConnected) this.__render();
  }

  ///////////////////////////////////////////////////////////////////

  private _leafclick = (event: MouseEvent, node: HTMLElement): void => {
    this.shadowRoot?.querySelector('.cur')?.classList.remove('cur');
    node.classList.add('cur')
    this.leafclick(event, gettexts(this.__leafs, Number(node.dataset.ix)));
  }
  private _leafclick_func = (event: MouseEvent, texts: string[]): void => { }

  /** leaf click 時のイベント関数を指定 (getter) */
  get leafclick() { return this._leafclick_func }
  /** leaf click 時のイベント関数を指定 (setter) */
  set leafclick(func: (event: MouseEvent, texts: string[]) => void) {
    this._leafclick_func = func;
  }

  ///////////////////////////////////////////////////////////////////

  private _leafmenu = (event: MouseEvent, node: HTMLElement): boolean => {
    return this.leafmenu(event, gettexts(this.__leafs, Number(node.dataset.ix)));
  }
  private _leafmenu_func = (event: MouseEvent, texts: string[]): boolean => true;

  /** leaf context 時のイベント関数を指定 (getter) */
  get leafmenu() { return this._leafmenu_func }
  /** leaf context 時のイベント関数を指定 (setter) */
  set leafmenu(func: (event: MouseEvent, texts: string[]) => boolean) {
    this._leafmenu_func = func;
  }

  ///////////////////////////////////////////////////////////////////
  /**
   * スタイル
   */
  private __styles: (string | CSSStyleSheet)[] = [];

  ///////////////////////////////////////////////////////////////////
  /**
   * 描画用にleafを作成する
   * @returns leafs
   */
  private __mkleaf(): LEAF[] {
    const [tree, leafs] = [this.tree, Array<LEAF>()];
    if (!tree || tree.length <= 0) return leafs;
    // make leaf
    const mkleaf = (_tree: TREE, _level: number) => {
      const [_text, _array] = (typeof _tree === 'string') ? [_tree,] : [, _tree];
      if (_text) leafs.push({ tx: _text, ix: Array(_level + 1).fill('b0') });
      if (_array) _array.forEach(_t => mkleaf(_t, _level + 1));
    }
    mkleaf(tree, -1);
    // make indent ( b0: , b1:│, b2:├, b3:└ )
    for (let _i = 1; _i < leafs.length; _i++) {
      const _l = leafs[_i];
      const [cur_l_max, bfo_l_max] = [_l.ix.length - 1, leafs[_i - 1].ix.length - 1];
      // set indent mark: before
      const bfo_l_1 = (bfo_l_max == cur_l_max) ? 'b2'
        : (bfo_l_max + 1 == cur_l_max || bfo_l_max > cur_l_max) ? 'b3' : undefined;
      if (bfo_l_1) leafs[_i - 1].ix[bfo_l_max] = bfo_l_1;
      // set indent mark: vertical line
      if (bfo_l_max > cur_l_max && cur_l_max >= 0) {
        for (let j = cur_l_max; j >= 0; j--) {
          for (let i = _i - 1; i >= 0; i--) {
            const _ix = leafs[i].ix;
            if (_ix[j] == 'b0') { _ix[j] = 'b1'; }
            if (_ix[j] == 'b3') { _ix[j] = 'b2'; break; }
          }
        }
      }
    }
    // set indent mark: last leaf
    const lastleaf = leafs[leafs.length - 1];
    lastleaf.ix[lastleaf.ix.length - 1] = 'b3';
    return leafs;
  }

  ///////////////////////////////////////////////////////////////////
  /**
   * 描画用にhtmlを作成する
   * @returns html string
   */
  private __makehtml(): string {
    this.__leafs  = this.__mkleaf();
    const _html = html`
      ${this.__leafs.reduce((r, leaf, i) =>
        r + html`<div tabindex="-1" data-ix="${i}"
          >${leaf.ix.reduce((r, ix) =>
            r + html`<div class="${ix}">&nbsp;</div>`, '')}<span>${leaf.tx}</span></div>`, '')}
    `;
    return _html;
  }

  ///////////////////////////////////////////////////////////////////
  /**
   * 初期化
   */
  private __init(shadow: ShadowRoot): void {
    this.__styles.push(TymWcTreeView.styles);
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
    shadow.childNodes.forEach(node => {
      //@ts-ignore
      node.addEventListener('contextmenu', (event) => this._leafmenu(event, node))
      //@ts-ignore
      node.addEventListener('click', (event) => this._leafclick(event, node))
    });
  }

  ///////////////////////////////////////////////////////////////////
  /**
   * 簡易ツリー表示 Web コンポーネント用スタイル
   */
  static bgSvg = ['M2 0 L2 16', 'M2 0 L2 16 M2 8 L12 8', 'M2 0 L2 8 L12 8']
    .map(point => `<path d='${point}' stroke='%23aaaaaa' fill='transparent'/>`)
    .map(path => `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 16'>${path}</svg>`)
    .map(svg => `2px 0/cover transparent no-repeat url("data:image/svg+xml;utf8,${svg}")`)
  static styles = css`
    :host {
      display: block;
      font-family: system-ui;
      --lh: 1.4em;
    }
    :host>div{
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      border: solid 1px transparent;
      border-radius: 2px;
      height: var(--lh);
      line-height: var(--lh);
      outline: none;
      white-space: nowrap;
      min-width: fit-content;
      user-select: none;
    }
    :host>div:focus {
      border-color: #888;
      background-color: #cef;
    }
    :host>div:hover {
      border-color: #444;
      background-color: #eff;
    }
    :host>div.cur {
      border-color: #888;
    }
    :host>div div {
      display: inline-block;
      width: .8em;
      margin-right: 2px;
    }
    div.b1 {
      background: ${TymWcTreeView.bgSvg[0]};
    }
    div.b2 {
      background: ${TymWcTreeView.bgSvg[1]};
    }
    div.b3 {
      background: ${TymWcTreeView.bgSvg[2]};
    }
  `;

}

/////////////////////////////////////////////////////////////////////
/**
 * defind custom element
 */
customElements.define('tym-wc-tree-view', TymWcTreeView);
