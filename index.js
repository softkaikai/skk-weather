const getopts = require('getopts');
const request = require('request');
const chalk = require('chalk');
const publicIp = require('public-ip');
const jsonp = require('node-jsonp');
const Table = require('cli-table2');
const ora = require('ora');


const argvs = process.argv.slice(2);
const opts = getopts(argvs);

const spinner = ora('Loading weather').start();

if (opts['_'] && opts['_'][0]) {
    queryWeather(opts['_'][0]);
} else {
    getCityForIp().then(city => {
        queryWeather(city);
    }).catch(err => {
        spinner.fail(err);
    })
}

async function getCityForIp() {
    ip = await publicIp.v4();
    if (!ip) {
        return Promise.reject('获取ip地址失败');
    }
    return new Promise((resolve, reject) => {
        request({
            url: `http://freeapi.ipip.net/${ip}`,
        }, (err, res, body) => {
            if (err) {
                reject(err);
            }
            if (body && body.length && body[3]) {
                resolve(body[3])
            }
            reject('获取地址失败')
        });
    })
}


function queryWeather(city = '成都') {
    jsonp(
        'https://www.tianqiapi.com/api/',
        {
            version: 'v1',
            city: city,
            callback: 'demo'
        },
        'callback',
        (json) => {
            if (json && json.data && json.data.length) {
                const table = new Table({
                    head: ['日期', chalk.yellow('天气'), chalk.green('最低温'), chalk.red('最高温'), chalk.magenta('空气质量'), '风力'],
                    // colWidths: [15, 15, 15, 15, 15, 15],
                    chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''}
                });
                const weathers = json.data.map(weather => {
                    return [
                        weather.day,
                        chalk.cyan(weather.wea),
                        weather.tem2,
                        weather.tem1,
                        chalk.green(weather.air_level || '良好'),
                        chalk.yellow(weather.win_speed),

                    ]
                });
                table.push(...weathers);
                spinner.succeed();
                console.log(table.toString());
            } else {
                spinner.fail('获取天气失败');
            }
        }

    )
}
