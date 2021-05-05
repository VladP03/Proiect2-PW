const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')

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

// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
app.get('/', (req, res) => res.send('Hello World'));

// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
app.get('/chestionar', (req, res) => {
	const listaIntrebari = [
		{
			titlu: 'Ce se vinde într-un magazin de papetărie?',
			variante: [
				'caiete, hârtie, creioane, penițe etc.', 
				'medicamente',
				'băuturi alcolice',
				'alimente',
				'obiecte destinate animaluțelor de companie'
			],
			corect: 0,
		},

		{
			titlu: 'Ce obiect este cel mai ieftin într-un magazin de papetărie?',
			variante: [
				'Creionul', 
				'Pixul', 
				'Caietul', 
				'Foaia A4'
			],
			corect: 3,
		},

		{
			titlu: 'Puteti gasi pixuri de toate culorile într-o papetărie?',
			variante: [
				'Da',
				'Nu',
				'Probabil'
			],	
			corect: 2,
		},

		{
			titlu: 'Exista mai multe magazine de papetării deschise decat de pariuri sportive?',
			variante: [
				'Da',
				'Nu',
				'Sigur ca nu'
			],	
			corect: 2,
		}
		//...
	];

	// în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care conține vectorul de întrebări
	res.render('chestionar', {intrebari: listaIntrebari});
});

app.post('/rezultat-chestionar', (req, res) => {
	console.log(req.body);
	res.send("formular: " + JSON.stringify(req.body));
});

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));