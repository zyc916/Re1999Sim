// @ts-check

import express from 'express';
import * as process from 'process';
'use strict';

const PORT = 3000;
var app: express.Express;

app = express();


app.use(express.static('static'));
app.get('/', (req: any, res: any) => {
    res.sendFile(__dirname + '/simulator.html');
});

app.get('/exit', (req: any, res: any) => {
    res.send('正在关闭服务器……');
    console.log('准备关闭服务器……');
    server.close(() => {
        console.log('服务器已关闭。');
        process.exit(0);
    });
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});  
