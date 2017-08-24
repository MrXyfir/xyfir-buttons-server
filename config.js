exports.environment = {
  type: 'prod',
  port: 2092
};

exports.database = {
  mysql: {
    host: '',
    port: 3306,
    user: '',
    password: '',
    database: 'xyfir_buttons',
    dateStrings: true,
    connectionLimit: 100,
    waitForConnections: true
  }
};

exports.keys = {
  accessToken: '',
  session: '',
  stripe: '',
  xacc: ''
};

exports.addresses = {
  xacc: 'https://accounts.xyfir.com/'
};