import * as https from 'https';
import * as querystring from 'querystring';
import * as config from './config';

interface Params {
    artistMbid: string;
    date?: string;
    p: number;
};

interface Options {
    method: string;
    encoding: string;
    host: string;
    path?: string;
    headers: any;
};

interface Setlist {
    date: string,
    venue: string,
    city: string
};

const mbid: string = '6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6'; // Grateful Dead MusicBrainz ID
const apiKey: string = config.apiKey;
const startYear = 1965;
const endYear = 1995;

let years: number[] = [];
for (let year: number = startYear; year <= endYear; year++) {
    years.push(year);
}

const month = new Date().getMonth() + 1;
const day = new Date().getDate();
const archiveLink = `https://archive.org/search.php?query=collection%3AGratefulDead+AND+title%3A%22-${month}-${day}%22&sort=-downloads`;
let setlists: Setlist[] = [];

const params: Params = {
    artistMbid: mbid,
    p: 1 // first page
};

const options: Options = {
    method: 'GET',
    encoding: null,
    host: 'api.setlist.fm',
    headers: { 
        'x-api-key': apiKey,
        'Accept': 'application/json'
    }
};

const processData = (data: any) => {
    const year = data.eventDate.substring(6, 12);
    return {
        date: year,
        venue: data.venue.name,
        city: data.venue.city.name
    }
}

function getData (year: number): void {

    params.date = `${day}-${month}-${year}`;
    const pathParams: string = querystring.stringify(params as any);
    
    options.path = `/rest/1.0/search/setlists?${pathParams}`;
    console.log(`trying ${year}`);
    const request = https.request(options, res => {
        res.on('data', data => {
            const buf = Buffer.from(data).toString();
            const json = JSON.parse(buf);
            if (json.code !== 404 && json.setlist) {
                const rawData = json.setlist[0];
                const processedData = processData(rawData);
                console.log(processedData);
                setlists.push(processedData);
            }
        });
    });

    request.end();

}

function buildText (): string {
    let text: string = `Concerts on this day:
    `;

    setlists.map(item => {
        text += `
        - ${item.date} - ${item.city} - ${item.venue}
        `;
    });

    text += `
    archive.org: ${archiveLink}`;
    return text;
}

const dataInterval: NodeJS.Timeout = setInterval(() => {
    if (years.length) {
        const year = years.shift();
        getData(year);
    } else {
        // console.log(setlists);
        clearInterval(dataInterval);
        console.log(buildText());
    }
}, 750);
