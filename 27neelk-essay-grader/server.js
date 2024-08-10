console.log('loading...')

const express = require("express")
const app = express()
app.set('view engine','ejs')
app.use(express.urlencoded({ extended: true }))

// css
app.use(express.static(__dirname + '/public'));

// mongodb setup
const dbname = 'test'
const mongoose = require("mongoose");
mongoose.connect('mongodb://localhost:27017/essaygrader').
	catch(error => console.log(error));
const essaySchema = new mongoose.Schema({
    name: String,
    text: String,
    score: Number
},
{ collection: dbname });
const db = mongoose.model(dbname, essaySchema);

// init preps
var preps=new Set();
const fs = require('fs');
fs.readFile('./data/preps.txt', 'utf8', (err, data) => {
	var x=data.split("\n");
	for(var i=0;i<x.length;i++) {
		if(x[i]!='') preps.add(x[i]);
	}
});

function grader(essay) {
	var why=[]
	var words=essay.split(" ")
	var score=100

	// word count
	score-=50
	if(words.length<500)
		why.push(["Essay is too short",50]);
	else if(words.length>1000)
		why.push(["Essay is too long",50]);
	else
		score+=50

	// NNN, typos
	var Typo = require("typo-js");
	var dictionary = new Typo("en_US");
	for(var i=0;i<words.length;i++) {
		var word=words[i];
		if(word.charAt(word.length-1)=='.' ||
			word.charAt(word.length-1)==',')
			word=word.slice(0,-1)
		if(word == '') continue

		tw=word
		word=word.toLowerCase()
		if(word=='very' || word=='really' || word=='get' ||
			word=='gotten' || word=='getting' || word=='got' ||
			word=='gets') {
			why.push([word + " is a NNN",1])
			score--;
		}
		word=tw

		if(dictionary.check(word) == false) {
			why.push([word + " is not a real word", 1]);
			score--;
		}
	}

	// sentence rules
	essay+=" ";
	var sents=essay.split(". ");

	for(var i=0;i<sents.length;i++) {
		let x = sents[i].split(" ");
		let w = x[0];
		for(var j=i+1;j<i+4 && j<sents.length;j++) {
			let x2 = sents[j].split(" ");
			let w2 = x2[0];
			if(w2==w) {
				why.push(["Sentence " + (i+1) + " has the same starting word as Sentence " + (j+1), 3]);
				score-=3;
			}
		}

		var xprep = x[x.length-1];
		if(xprep.charAt(xprep.length-1)=='.') xprep=xprep.substring(0,-1);
		if(preps.has(xprep)) {
			why.push(["The last word of sentence " + (i+1) + " is a preposition", 5]);
			score-=5;
		}
	}

	return [why,Math.max(-200,score)];
}

app.get('/', (req,res) => {
	res.render('index')
})

app.post('/submit', (req,res) => {
	var [w,score] = grader(req.body.essay);
	db.findOne({ 'text':req.body.essay })
		.then((result)=>{
			if(result != null) {
				w = [['PLAGARISM', 'automatic 0']];
				score = 0;
			}
			const ndoc = new db({ "name":req.body.name, "text":req.body.essay, "score":score });
			ndoc.save().then(function(result) {
				res.render('result',{
					essay:req.body.essay,
					name:`${req.body.name}`,
					score:score,
					why:w
				})
			})
		})
		.catch((error)=>{
			res.status(500).json(error)
			console.log(error)
		});
});

app.get('/admin', (req,res) => {
	db.find()
		.then((result)=>{
			res.render('admin',{
				json:result
			})
		})
		.catch((error)=>{
			res.status(500).json(error)
			console.log(error)
		});
});

app.listen(2020);
console.log('Essay Submission: http://localhost:2020/');
console.log('Admin Portal: http://localhost:2020/admin');
