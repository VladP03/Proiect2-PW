const cookieParser = require('cookie-parser');
const session = require('express-session');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const { Console } = require('console');

const app = express();

const port = 6789;

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

// Laborator 12 -> Oracle
const oracledb = require('oracledb');
oracledb.autoCommit = true;
const conString ="(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521)))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=orcl)))";

// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res

session.utilizator = undefined;

app.get('/', (req, res) => {
	let connection;

	var id = [];				// pentru id
	var produs = [];			// pentru produse
	var pret = [];				// pentru preturi

	(async function() {
		try{
		   connection = await oracledb.getConnection({
				user          : "C##PW",
				password      : "pw",
				connectString : conString
		   });
		   	console.log("Successfully connected to Oracle!")

			const result = await connection.execute(`SELECT * from cumparaturi`,);
		  
		   	for (let i=0;i< result.rows.length;i++) {
				id[i] = result.rows[i][0];
				produs[i] = result.rows[i][1];
				pret[i] = result.rows[i][2];
		   	}

			res.render('index', {utilizator: req.session.utilizator, id: id, produs: produs, pret: pret});
			   
		} catch(err) {
			console.log("Error: ", err);
		  } finally {
			if (connection) {
			  try {				
				  await connection.close();
			  } catch(err) {
				console.log("Error when closing the database connection: ", err);
			  }
			}
		  }
		})()

	//res.render('index', {utilizator: req.session.utilizator, id: id, produs: produs, pret: pret});
});

// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
let listaIntrebari;
app.get('/chestionar', (req, res) => {
	const fs = require('fs');

	fs.readFile('intrebari.json', (err, data) => {
		if (err) throw err;
		listaIntrebari = JSON.parse(data);

		// în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care conține vectorul de întrebări
		res.render('chestionar', {intrebari: listaIntrebari, utilizator: req.session.utilizator});
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
		
		res.render("rezultat-chestionar", { 'corecte' : numarRaspunsuriCorecte, 'total' :  listaIntrebari.length, utilizator: req.session.utilizator});
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
	let connection;

	(async function() {
		try{
		   connection = await oracledb.getConnection({
				user          : "C##PW",
				password      : "pw",
				connectString : conString
		   });
		   console.log("Successfully connected to Oracle!")

		   //await connection.execute(`DROP TABLE cumparaturi`);
		   await connection.execute(`
		   CREATE TABLE cumparaturi (
				id              integer             GENERATED ALWAYS AS IDENTITY(START WITH 1 INCREMENT BY 1),
				produs          VARCHAR2(255)       NOT NULL,
				pret            integer             NOT NULL
			)`);

		} catch(err) {
			console.log("Error: ", err);
		  } finally {
			if (connection) {
			  try {				
				  await connection.close();
			  } catch(err) {
				console.log("Error when closing the database connection: ", err);
			  }
			}
		  }
		})()

	// Redirect pe pagina principala
	res.redirect('http://localhost:6789/');
});

app.get('/inserare-bd', (req, res) => {
	// TO DO cu baza de date
	let connection;

	(async function() {
		try{
		   let connection = await oracledb.getConnection({
				user          : "C##PW",
				password      : "pw",
				connectString : conString
		   });
		   console.log("Successfully connected to Oracle!")

		   await connection.execute(`INSERT INTO cumparaturi(produs, pret) VALUES ('creion', 2)`);
		   await connection.execute(`INSERT INTO cumparaturi(produs, pret) VALUES ('foaie A4', 1)`);

		} catch(err) {
			console.log("Error: ", err);
		  } finally {
			if (connection) {
			  try {				
				  await connection.close();
			  } catch(err) {
				console.log("Error when closing the database connection: ", err);
			  }
			}
		  }
		})()
	// Redirect pe pagina principala
	res.redirect('http://localhost:6789/');
});

session.produse = [];
app.get('/adaugare_cos', (req,res) => {	

	const id = req.query.id;
	let connection;

	(async function() {
		try{
		   let connection = await oracledb.getConnection({
				user          : "C##PW",
				password      : "pw",
				connectString : conString
		   });
		   console.log("Successfully connected to Oracle!")

		   let result = await connection.execute("SELECT * FROM cumparaturi WHERE id = " + id + "");
		   session.produse[session.produse.length] = {
				"produs": result.rows[0][1],
				"pret": result.rows[0][2]
		   };

		   console.log(session.produse);

		   res.redirect('http://localhost:6789/');

		} catch(err) {
			console.log("Error: ", err);
		  } finally {
			if (connection) {
			  try {				
				  await connection.close();
			  } catch(err) {
				console.log("Error when closing the database connection: ", err);
			  }
			}
		  }
		})()

	// Redirect pe pagina principala
	//res.redirect('http://localhost:6789/');
});

app.get('/vizualizare-cos', (req,res) => {	

	res.render('vizualizare-cos', {utilizator: req.session.utilizator, produse: session.produse});
});


app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));