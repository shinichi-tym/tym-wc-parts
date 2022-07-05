/*!
 * tym-wc-base.js
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
 * create a class for the element
 */
export class TymWcBase extends HTMLElement {

  constructor() {
    console.log('>> constructor.');
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    console.log('>> added to page.');
  }

  disconnectedCallback() {
    console.log('>> removed from page.');
  }

  adoptedCallback() {
    console.log('>> moved to new page.');
  }

  static get observedAttributes() { return [] }
  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    console.log('>> attributes changed.', name, oldValue, newValue);
  }

}

/////////////////////////////////////////////////////////////////////
/**
 * defind custom element
 */
// customElements.define('tym-wc-base', TymWcBase);
