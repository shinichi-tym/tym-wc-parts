<div align="center">
  <h1>tym-wc-parts</h1>
</div>

<br>

私こと **tym** が作成した Web Component 群です。

<br>

---

<br>

動作イメージ (Demo screen)

[https://shinichi-tym.github.io/tym-wc-parts-demo/]

<br>

## インストール `(Installation)`

<br>

```
npm i tym-wc-parts

※ CDN 利用の場合は不要
```

## 使い方 `(Usage:Angular)`

```typescript : app.module.ts
//--- app.module.ts ---
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
  :
@NgModule({
  :
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  :
})

//--- app.component.ts ---
import 'tym-wc-parts';
  :
@Output() textContent: string = [
  ['header','header','header','header'],
  ['aaa',123,'AAA',12345],
  ['bbb',456,'BBB',456789],
].join('\n');
  :
```

```html
<tym-wc-table-view
 [textContent]="textContent"
 right-cols="2,4"
 last-sp="false"
></tym-wc-table-view>
```

## 使い方 `(Usage:CDN)`

```html
<tym-wc-table-view right-cols="2,4" last-sp="false">
  header,header,header,header
  aaa,123,AAA,12345
  bbb,456,BBB,456789
</tym-wc-table-view>

<script type="module">
  //(例)
  import 'https://unpkg.com/tym-wc-parts/tym-wc-table-view.js';
  // import 'tym-wc-parts/';
</script>

  :
```

<br>

---

<br>

<h2 id="tym-wc-table-view"></h2>

> ## 簡易テーブル表示 `[tym-wc-table-view]`

<br>

単純な csv 形式データを, 簡易にテーブル表示します。  
行ヘッダーをマウスでリサイズできます(not firefox)。

<br>

表示サンプル (Display image)

![表示サンプル](/tym-wc-table-view.png)

<br>

- [定義]
``` html
<tym-wc-table-view
  cols="単価,販売数,売上"
  right-cols="1,2,3"
  center-cols=""
  last-sp="false"
  max-width="200">
980,627,614460
1980,1219,2413620
2980,116,345680
3980,616,2451680
</tym-wc-table-view>
<!-- 各パラメタは javascript 等で更新しても反映されない-->
```

- `cols: csv`
  - カラムヘッダーを csv 形式で指定する
  - 省略した場合は, `textContent` の先頭行をカラムヘッダーとして表示する

- `right-cols: csv`
  - 右揃えカラムの番号を csv 形式で指定する

- `center-cols: csv`
  - 中央揃えカラムの番号を csv 形式で指定する

- `last-sp: boolean`
  - 最終カラムを追加するか否かを指定する
    - true : 追加する(デフォルト)
    - false : 追加しない

- `max-width: number`
  - セル幅が大きい場合の最大セル幅を指定する (default 200)

- `textContent: string`
  - 表示するデータを 改行区切りの csv 形式で指定する
  - `textContent` は, 一度だけ更新できる

## Usage

```html
<script type="module">
  import 'https://unpkg.com/tym-wc-parts/tym-wc-table-view.js';
</script>

<tym-wc-table-view
 right-cols="1,2,3"
 center-cols=""
 last-sp="false"
 max-width="200">
  単価,販売数,売上
  980,627,614460
  1980,1219,2413620
  2980,116,345680
  3980,616,2451680
</tym-wc-table-view>
```

```html
<script type="module">
  import 'https://unpkg.com/tym-wc-parts/tym-wc-table-view.js';
</script>

<tym-wc-table-view id="tymWcTableView"
 cols="単価,販売数,売上"
 right-cols="1,2,3"
 center-cols=""
 last-sp="false"
 max-width="200"
></tym-wc-table-view>

<script type="javascript">
  document.getElementById("tymWcTableView")
    .textContent = [
      [980,627,614460],
      [1980,1219,2413620],
      [2980,116,345680],
      [3980,616,2451680]
    ].join("\n");
</script>
```

<br>

<h2 id="tym-wc-tree-view"></h2>

> ## 簡易ツリー表示 `[tym-wc-tree-view]`

<br>

単純な文字列ツリー構造データを，簡易にツリー表示します。  
選択内容の通知が可能です。コンテキストメニューが可能です。

<br>

表示サンプル (Display image)

![表示サンプル](/tym-wc-tree-view.png)

<br>

- [定義]
``` html
<tym-wc-tree-view></tym-wc-tree-view>
```

- `tree: TREE`
  - 文字列ツリー構造データを指定する
    ``` typescript
    type TREE = TREE[] | string
    const tree: TREE = [
      'leaf-text',
      'leaf-text',
      [
        'leaf-text',
        'leaf-text',
      ],
      'leaf-text',
    ]
    ```
- `leafclick: (event: MouseEvent, texts: string[]) => void`
  - leaf クリック時の関数を指定する
    ``` typescript
    target.leafclick = (event, texts) => {
      console.log(event, texts);
    }
    ```
- `leafmenu: (event: MouseEvent, texts: string[]) => void`
  - leaf 右クリック時の関数を指定する
    ``` typescript
    target.leafmenu = (event, texts) => {
      console.log(event, texts);
      event.preventDefault();
      return false;
    }
    ```

## Usage

```html
<script type="module">
  import 'https://unpkg.com/tym-wc-parts/tym-wc-tree-view.js';
</script>

<tym-wc-tree-view id="target"></tym-wc-tree-view>

<script>
  var target = document.getElementById('target');
  target.tree = [
    'leaf-text',
    'leaf-text',
    [
      'leaf-text',
      'leaf-text',
    ],
    'leaf-text',
  ];
  target.leafclick = (event, texts) => {
    console.log(event, texts);
  }
  target.leafmenu = (event, texts) => {
    console.log(event, texts);
    event.preventDefault();
    return false;
  }
</script>
```

## Usage:Angular

```html
<tym-wc-tree-view
  [tree]="treedata"
  [leafclick]="leafclick"
  [leafmenu]="leafmenu"
></tym-wc-tree-view>
```

```typescript
@Output() treedata = [
  'leaf-text',
  'leaf-text',
  [
    'leaf-text',
    'leaf-text',
  ],
  'leaf-text',
];
@Output() leafclick = (event: MouseEvent, texts: string[]) => {
  console.log(event, texts);
}
@Output() leafmenu = (event: MouseEvent, texts: string[]) => {
  console.log(event, texts);
  event.preventDefault();
  return false;
}
```

<br>

---
### ライセンス (License)
The components in tym-ng-ws are released under the MIT license. [Read license](//github.com/shinichi-tym/tym-wc-parts/blob/main/LICENSE).

---
Copyrights belong to shinichi tayama (shinichi.tym).
