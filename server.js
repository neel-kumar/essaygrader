const express = require("express")
const app = express()

app.set('view engine','ejs')
app.use(express.urlencoded({ extended: true }))

app.get('/', (req,res) => {
	res.render('index')
})

function grader(essay) {
	var why=[]
	var words=essay.split(" ")
	var score=100

	// word count
	score-=50
	if(words.length<500)
		why.push("Essay is too short ... -50%");
	else if(words.length>1000)
		why.push("Essay is too long ... -50%");
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
			why.push(word + " is a NNN ... -1%")
			score--;
		}
		word=tw

		if(dictionary.check(word) == false) {
			why.push(word + " is not a real word ... -1%");
		}
	}

	// sentence rules
	var sents=essay.split(".")
	// end in prep
	sents.forEach((s) => {
		var x = s.split(" ");
		var w = x[x.length - 1];
	});

	return [why,score];
}

app.post('/submit', (req,res) => {
	var [thirteenreasonswhy,score] = grader(req.body.essay);
	var msg='';
	if(score > 97) msg='You 🔥cooked🔥 excellent job'
	else if(score > 87) msg='You did decent'
	else if(score > 77) msg='You better come for extra credit'
	else if(score > 67) msg='The rest of your semester will be terrible'
	else msg='I am impressed ..... by how low you managed to score'
	res.render('result',{
		essay:req.body.essay,
		scoremsg:`${msg}`,
		score:score,
		why:thirteenreasonswhy
	})
})

app.listen(2020)
