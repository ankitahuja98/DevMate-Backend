const { google } = require("googleapis");

const GOOGLE_CLIENTID = process.env.GOOGLE_CLIENTID;
const GOOGLE_CLIENT_SECRETID = process.env.GOOGLE_CLIENT_SECRETID;

exports.oauth2client = new google.auth.OAuth2(
  GOOGLE_CLIENTID,
  GOOGLE_CLIENT_SECRETID,
  "postmessage",
);
