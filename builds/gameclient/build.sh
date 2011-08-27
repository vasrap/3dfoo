#/bash/sh
rm -rf temp gameclient.js
mkdir temp
java -jar yuicompressor-2.4.6.jar ../../gameclient/lib/js/Chat.js -o temp/5
java -jar yuicompressor-2.4.6.jar ../../gameclient/lib/js/Dom.js -o temp/3
java -jar yuicompressor-2.4.6.jar ../../gameclient/lib/js/Oauth.js -o temp/4
java -jar yuicompressor-2.4.6.jar ../../gameclient/lib/js/Gfx.js -o temp/6
java -jar yuicompressor-2.4.6.jar ../../gameclient/lib/js/jwsGameLogicPlugIn.js -o temp/-1
java -jar yuicompressor-2.4.6.jar ../../gameclient/lib/js/Map.js -o temp/8
java -jar yuicompressor-2.4.6.jar ../../gameclient/lib/js/Msg.js -o temp/7
java -jar yuicompressor-2.4.6.jar ../../gameclient/lib/js/Pools.js -o temp/2
java -jar yuicompressor-2.4.6.jar ../../gameclient/lib/js/Utils.js -o temp/1
touch gameclient.js
cat temp/-1 >> gameclient.js
cat temp/1 >> gameclient.js
cat temp/2 >> gameclient.js
cat temp/3 >> gameclient.js
cat temp/4 >> gameclient.js
cat temp/5 >> gameclient.js
cat temp/6 >> gameclient.js
cat temp/7 >> gameclient.js
cat temp/8 >> gameclient.js
rm -rf temp
