# Celar-backend
Celarのbackend

# Usage
1. `.env.temp`を参考にして、`.env`を作成します。　　
2. `npm install`で、モジュールをインストールしてください。  
3. `node index.js`でサーバーを起動します。  

# Requirements
Node.js

# Enviroment
`.env`ファイルに書き込む内容の詳細です。

key|value
---|---
HTTPPORT|HTTPAPIサーバーのポート
WSPORT|WebSocketサーバーのポート
FRONTEND_PATH|フロントエンドのファイル場所
FRONTEND_URL|フロントエンドのURL（CORS用）
