import Gun from "gun";
import './build/index.js'

const gun = Gun();
(async () => {
    let key = await gun.keys('secret');
    console.log(key);
    gun.vault('newvault', key, (data) => {
        console.log(data);
    })
})()