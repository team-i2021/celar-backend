# Backend Syntax
WebSocketサーバーの構文

__あくまでも予定というか想定というか思考というか...__

# 各データの種類
```ts
command: string
uid: number
password: string
user_id: number
action: string
content: any

位置情報: number[lat, lng, speed, time]
```

# メソッド一覧

## GET
指定したユーザーの位置情報データを返すメソッド（廃止予定）  

- 引数
```js
{
  command: "GET",
  uid: 自身のUID,
  password: 自身のパスワード,
  user_id: 対象のUID
}
```

- 戻り値
```js
{
  action: "GET",
  content: 位置情報
}
```

- 例外
`UserNotFound`:指定したユーザーが見つからなかった
`NotAccessable`:指定したユーザーの位置情報を取得する権限がない

## POST
自身の位置情報を送信するメソッド

- 引数
```js
{
  command: "POST",
  uid: 自身のUID,
  password: 自身のパスワード,
  location: 位置情報
}
```

- 戻り値
```js
{
  action: "OK",
  cotent: "POST"
}
```

## REGISTER
ユーザーを新規作成するためのメソッド

- 引数
```js
{
  command: "REGISTER",
  password: パスワード
}
```

- 戻り値
```js
{
  action: "REGISTER",
  content: {
    uid: 自身のUID,
    password: パスワード
  }
}
```

## FRIEND
フレンドを管理するためのメソッド集合

- 例外
`UnknownArgument`:集合の中に存在しないメソッドを指定しようとした

### ADD
フレンド申請をするメソッド  
これで申請をすることで、自身と相手のフレンド待機列にそれぞれのUIDが入ります。

- 引数
```js
{
  command: "FRIEND",
  action: "ADD",
  uid: 自身のUID,
  password: 自身のパスワード,
  user_id: 対象のUID
}
```

- 戻り値
```js
{
  action: "OK",
  content: "FRIEND_ADD"
}
```

### DEL
フレンドを削除するメソッド  
自身と相手のフレンドリストからそれぞれのUIDが消えます。

- 引数
```js
{
  command: "FRIEND",
  action: "DEL",
  uid: 自身のUID,
  password: 自身のパスワード,
  user_id: 対象のUID
}
```

- 戻り値
```js
{
  action: "OK",
  content: "FRIEND_DEL"
}
```

- 例外
`UserNotFound`:指定したユーザーがフレンドにいない

### GET
自身のフレンドリストを取得するメソッド  
UIDの配列が返ってきます。

- 引数
```js
{
  command: "FRIEND",
  action: "GET",
  uid: 自身のUID,
  password: 自身のパスワード
}
```

- 戻り値
```js
{
  action: "FRIENDS",
  content: フレンドリスト
}
```

### ALLOW
送られたフレンド承認を許可するメソッド

- 引数
```js
{
  command: "FRIEND",
  action: "ALLOW",
  uid: 自身のUID,
  password: 自身のパスワード,
  user_id: 対象のUID
}
```

- 戻り値
```js
{
  action: "OK",
  content: "FRIEND_ALLOW"
}
```

- 例外
`RequestNotFound`:指定したユーザーから送られたフレンド承認が存在しない

### DENY
送られたフレンド承認を拒否するメソッド

- 引数
```js
{
  command: "FRIEND",
  action: "DENY",
  uid: 自身のUID,
  password: 自身のパスワード,
  user_id: 対象のUID
}
```

- 戻り値
```js
{
  action: "OK",
  content: "FRIEND_DENY"
}
```

- 例外
`RequestNotFound`:指定したユーザーから送られたフレンド承認が存在しない

## FETCH
自身のフレンドの位置情報全員分と自身のデータベースにある位置情報を取得するメソッド

- 引数
```js
{
  command: "FETCH",
  uid: 自身のUID,
  password: 自身のパスワード
}
```

- 戻り値
```ts
{
  action: "FETCH",
  content: {
    [uid: string]: 位置情報
  }
}
```

## INIT
アプリ起動時にイニシャライズするためのデータを受け取るメソッド

- 引数
```js
{
  command: "INIT",
  uid: 自身のUID,
  password: 自身のパスワード
}
```

- 戻り値
```js
{
  action: "INIT",
  content: {
    user: 自身のユーザーデータ,
    friends: フレンドの簡易ユーザーデータ[],
    requests: 受けたフレンド申請の簡易ユーザーデータ[]
  }
}
```

# 共通例外
ほぼ全てのメソッドで共通して発生する可能性がある例外

`Forbidden`:データにユーザーが存在しないか、パスワードが間違っているために認証に失敗した
`BadRequest`:リクエストにUIDやパスワードが含まれていなかった
