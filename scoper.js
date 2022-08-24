import Gun from "gun";
import './build/index';

const gun = Gun({ file: 'scopetest' });

    console.clear();
gun.watch(['./src/*'],ack => console.log(ack, 'ack'))

gun.unpack('didwefix', ack => console.log(ack, 'pack'))
