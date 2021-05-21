const cookieParser = require('cookie-parser');
const session = require('express-session');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const { Console } = require('console');

const app = express();

const port = 6789;

// laborator 12
const conString ="Data Source=(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521)))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=orcl)));User Id=C##pw;Password=pw;";
const oracledb = require('oracledb');
oracledb.getConnection(
    {
      user: 'C##PW', 
      password: 'pw',
      connectString: conString
    }, 
    function(err, connection) {
      if (err) {error = err; return;}
      
      connection.execute('select id from test', [], function(err, result) {
        if (err) {error = err; return;}
 
        console.log(result.rows[0][0]);
        
 
        connection.close(function(err) {
          if (err) {console.log(err);}
        });
      })
    }
);

/*
const oracledb = require('oracledb');
try {
  oracledb.initOracleClient({libDir: 'C:\\oracle\\instantclient_19_6'});
} catch (err) {
  console.error('Whoops!');
  console.error(err);
  process.exit(1);
}
*/

// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));

// Laborator 11 -> cookie & sessions
app.use(cookieParser());
app.use(session({
	secret: 'secret',				// used to sign cookies
	resave: false,					// forces the session to be saved back to the session store, even if the session was never modified during the request
	saveUninitialized: false,
	//cookie: {
		//maxAge: 10000				//  tell for how long browser will hold the cookie(value in millisecond), default is when the browser window will terminate then the cookies will be cleared.
	//}
}));

// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
app.get('/', (req, res) => {

	//console.log(req.cookies);

	if (!req.session.content) {
		req.session.count = 1;
	} else {
		req.session.count += 1;
	}

	res.render('index', {utilizator: req.session.utilizator});
});

// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
let listaIntrebari;
app.get('/chestionar', (req, res) => {
	const fs = require('fs');

	fs.readFile('intrebari.json', (err, data) => {
		if (err) throw err;
		listaIntrebari = JSON.parse(data);

		// în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care conține vectorul de întrebări
		res.render('chestionar', {intrebari: listaIntrebari});
	});
});

app.post('/rezultat-chestionar', (req, res) => {

	if(listaIntrebari) {
		const respunsuriPrimite = req.body;
		//console.log(respunsuriPrimite);

		let numarRaspunsuriCorecte = 0;

		for (let i=0;i<listaIntrebari.length;i++) {
			const elementKey = i + '_' + listaIntrebari[i].corect;
			//console.log(elementKey);
			if (respunsuriPrimite[i] == elementKey) {
				numarRaspunsuriCorecte++;
			}
		}
		
		res.render("rezultat-chestionar", { 'corecte' : numarRaspunsuriCorecte, 'total' :  listaIntrebari.length});
	}
});

app.get('/autentificare', (req, res) => {
	res.render('autentificare', {utilizator: req.cookies.utilizator});
});

app.post('/verificare-autentificare', (req, res) => {
	
	console.log(req.body);

	const fs = require('fs');	
	fs.readFile('utilizatori.json', (err, data) => {
		if (err) throw err;
		let listaUseri = JSON.parse(data);

		let ok =0;
		for (let i=0;i<listaUseri.length;i++) {
			//console.log(listaUseri[i].username + " " + listaUseri[i].password);

			if (listaUseri[i].username == req.body.user && listaUseri[i].password == req.body.pass) {
				ok=1;

				res.cookie("utilizator", listaUseri[i].username);	//  {nume: listaUseri[i].nume, prenume: listaUseri[i].prenume}
				req.session.utilizator = listaUseri[i].username
				req.session.nume = listaUseri[i].nume;
				req.session.prenume = listaUseri[i].prenume;

				res.redirect('http://localhost:6789/');
			}
		}

		if (ok == 0) {
			res.cookie("utilizator", "mesajEroare");

			res.redirect('http://localhost:6789/autentificare');
		}
	})
});

app.get('/delogare', (req,res) => {
	res.clearCookie('utilizator');
	req.session.utilizator = undefined;

	res.redirect('/');
});

app.get('/creare-bd', (req, res) => {
	// TO DO cu baza de date
	//console.log("Am intrat in creare-bd");

	module.exports = {
		user          : "C##pw",
		password      : "pw",
		connectString : "localhost/orcl"
	};

	const sql = "SELECT * FROM TEST;";
	console.log()


	// Redirect pe pagina principala
	res.redirect('http://localhost:6789/');
});

app.get('/inserare-bd', (req, res) => {
	// TO DO cu baza de date
	//console.log("Am intrat in inserare-bd");

	// Redirect pe pagina principala
	res.redirect('http://localhost:6789/');
});


app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));