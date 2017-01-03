const choo = require('choo');
const html = require('choo/html');
const http = require('choo/http');
const queryString = require('query-string');
const store = require('./utils/localstorage.js');

const app = choo();
// const appURL = 'https://5calls.org';
const appURL = 'http://localhost:8090';
const debug = true;

// get the stored zip location
initialZip = '';
store.getAll('org.5calls.location', (location) => {
  if (location.length > 0) {
   initialZip = location[0]
  }
});

// get the stored completed issues
completedIssues = [];
store.getAll('5calls-complete', (completed) => { completedIssues = completed; } );

app.model({
  state: {
    issues: [],
    zip: initialZip,
    activeIssue: false,
    contactIndex: 0,
    completedIssues: completedIssues,
    debug: debug,
  },

  reducers: {
    receive: (data, state) => {
      issues = JSON.parse(data).filter((v) => { return v.contacts.length > 0 });
      return { issues: issues }
    },
    locationState: (zip, state) => {
      store.replace("org.5calls.location", 0, zip, () => {});
      
      return { zip: zip }
    },
    changeActiveIssue: (issueId, state) => ({ activeIssue: issueId, contactIndex: 0 }),
    incrementContact: (data, state) => {
      if (true) {
        return { contactIndex: state.contactIndex + 1 }
      }
    },
    resetLocation: (data, state) => {
      store.remove("org.5calls.location", () => {});
      return { zip: '' }
    },
  },

  effects: {
    fetch: (data, state, send, done) => {
      http(appURL+'/issues/'+state.zip, (err, res, body) => {
        send('receive', body, done)
      })
    },
    setLocation: (data, state, send, done) => {
      send('locationState', data, done);
      send('fetch', {}, done);
    },
    callComplete: (data, state, send, done) => {
      const body = queryString.stringify({ location: state.zip, result: data.result })
      http.post(appURL+'/report', { body: body, headers: {"Content-Type": "application/x-www-form-urlencoded"} }, (err, res, body) => {
        // don't really care about the result
      })
      send('incrementContact', data, done);
    },
  },
});

app.router((route) => [
  route('/', require('./pages/mainView.js'))
]);

const tree = app.start('#root');
