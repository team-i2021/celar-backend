# Backend Syntax
バックエンドサーバーのシンタックスについて...  
SQL構文みたいなのを目指してます（適当）

__あくまでも予定というか想定というか思考というか...__

# Send Location
自身の位置情報を送信するためのメソッド。

- 送り値
  ```
  SEND_LOCATION/<ID>/<TOKEN>/<POSITION>
  ```

  - ID  
  ログイン用のID。

  - TOKEN  
  ログイン用のトークン。

  - POSITION  
  位置情報データ。  
  `[lng, lat, speed, time]`の形。

- 戻り値
  ```
  Location received.
  ```

# Get User Location
他のユーザーの位置情報を取得するためのメソッド。

- 送り値
  ```
  GET_USER_LOCATION/<ID>/<TOKEN>/<USER_ID>
  ```

  - ID  
  ログイン用のID。

  - TOKEN  
  ログイン用のトークン。

  - USER_ID  
  取得したいユーザーの位置情報。

- 戻り値
  ```
  POSITION/<USER_ID>/<POSITION>
  ```

  - USER_ID  
  取得したユーザーの位置情報

  - POSITION  
  位置情報データ。  
  `[lng, lat, speed, time]`の形。

このメソッドを使用するには、ユーザー同士がフレンドである必要があります。
