/*!
 * tym-wc-table-view.js
 * Copyright (c) 2022 shinichi tayama
 * Released under the MIT license.
 * see https://opensource.org/licenses/MIT
 */

import { html, css, LitElement, PropertyValueMap } from "lit";
import { customElement, property } from "lit/decorators.js";

/////////////////////////////////////////////////////////////////////
/**
 * 簡易テーブル表示 Web コンポーネント
 */
@customElement("tym-wc-table-view")
export class TymWcTableView extends LitElement {
  @property({ type: Array }) cols: string[] = [];

  @property({ type: Boolean }) lastsp: boolean = true;

  @property({ type: Number }) maxWidth: number = 200;

  @property({ type: Array }) rightCols: number[] = [];

  @property({ type: Array }) centerCols: number[] = [];

  ///////////////////////////////////////////////////////////////////
  /**
   * セル幅を調整する
   */
  private __resize(): void {
    const shadow = this.shadowRoot as ShadowRoot;
    const tableElm = shadow.querySelector("table") as HTMLTableElement; // table
    if (!tableElm) return;
    const theadElm = FIRST_ELM_CHILD(tableElm) as HTMLTableSectionElement; // thead
    const theadTrElm = FIRST_ELM_CHILD(theadElm) as HTMLTableRowElement; // tr
    const theadTrLastThElm = theadTrElm.lastElementChild as HTMLElement; // last th
    const thElms = theadTrElm.querySelectorAll("th");
    tableElm.style.width = "";
    thElms.forEach((th) => (th.style.width = ""));
    thElms.forEach((th) => {
      th.style.width =
        th.clientWidth > this.maxWidth
          ? `${this.maxWidth}px`
          : window.getComputedStyle(th).width;
    });
    tableElm.style.width = this.lastsp
      ? ((theadTrLastThElm.style.width = ""), "100%")
      : "fit-content";
  }

  ///////////////////////////////////////////////////////////////////
  /**
   * 描画用にcolsおよびdataを作成する
   * @returns [cols:string[], data:string[][]]
   */
  private __makedata(): [string[], string[][]] {
    /////////////////////////////////////////////////////////////////
    // make cols and data from textContent,this.cols
    const txt = (this.textContent || "").trim();
    if (this.cols.length <= 0 && txt.length <= 0) return [[], []];
    let data: string[][] = [];
    txt
      .split(/\r\n|\n/)
      .forEach((row) => data.push(row.split(",").map((v) => v.trim())));
    let cols =
      !this.cols || this.cols.length <= 0
        ? (data.shift() as string[])
        : this.cols;
    const colmax = Math.max(
      cols.length,
      data.reduce((a, b) => (a.length > b.length ? a : b)).length
    );
    /////////////////////////////////////////////////////////////////
    // make _cols and _data (empty cell fill by "")
    let _cols = Array<string>(colmax).fill("");
    cols.forEach((col, i) => (_cols[i] = col));
    let _data: string[][] = new Array(data.length);
    for (let index = 0; index < data.length; index++) {
      _data[index] = new Array(colmax).fill("");
    }
    data.forEach((row, i) => {
      row.forEach((col, j) => (_data[i][j] = col));
    });
    return [_cols, _data];
  }

  ///////////////////////////////////////////////////////////////////
  /**
   * DOM表示 (render)(Lifecycle Event)
   * @returns html
   */
  protected render(): unknown {
    const [_cols, _data] = this.__makedata();
    const [lastspth, lastsptd] = this.lastsp
      ? [html`<th class="lastsp"></th>`, html`<td class="lastsp"></td>`]
      : [EMPTY_HTML, EMPTY_HTML];
    return html`
      <table>
        <thead>
          <tr>
            ${_cols.map(
              (col) => html`<th title="${col}">${col}</th>`
            )}${lastspth}
          </tr>
        </thead>
        <tbody>
          ${_data.map(
            (row) =>
              html`<tr>
                ${row.map(
                  (col) => html`<td title="${col}">${col}</td>`
                )}${lastsptd}
              </tr>`
          )}
        </tbody>
      </table>
      <style>
        ${this.rightCols.map(
          (col) => html`tbody tr td:nth-child(${col}){text-align:right}`
        )}
        ${this.centerCols.map(
          (col) => html`tbody tr td:nth-child(${col}){text-align:center}`
        )}
      </style>
    `;
  }

  ///////////////////////////////////////////////////////////////////
  /**
   * DOM更新 (updated)(Lifecycle Event)
   * @param _changedProperties
   */
  protected updated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
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
 * 定数
 */
const EMPTY_HTML = html``;
const FIRST_ELM_CHILD = (elm: HTMLElement) => elm.firstElementChild;
