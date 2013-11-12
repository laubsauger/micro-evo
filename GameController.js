"use strict"
//game
document.write('<script type="text/javascript" src="CreepObj.js"></script>');
document.write('<script type="text/javascript" src="FoodObj.js"></script>');

//utils
document.write('<script type="text/javascript" src="RequestAnimationFrame.js"></script>');
document.write('<script type="text/javascript" src="Stats.js"></script>');
document.write('<script type="text/javascript" src="quadTree/QuadTree.js"></script>');
document.write('<script type="text/javascript" src="quadTree/easel.js"></script>');

var canvas,
	ctx,
	CHEIGHT,
	CWIDTH,
	CREEP_SIZE        = 8,
	FOOD_SIZE         = 10,
	creeps            = new Array(),
	initialCreepCount = 200,
	creepCount,
	femaleColor       = '#EA2BBA',
	maleColor         = '#27AEEF',
	deadColor         = '#414141',
	foodColor         = '#37FF2D',
	creepTickLength   = 10, //number of frames per creepTick
	creepTicks        = 0,
	foodTickLength    = 10, //number of creepTicks per foodTick
	foodTicks         = 0,
	ticksToVanish     = (foodTickLength * creepTickLength) * 2,
	food,
	foodBox,
	creepBox,
	statsElements, statsCounter,
	energyRangeA      = 50,
	energyRangeB      = 150,
	showOverlay = false,
	bounds,
	tree,
	shape,quadStage,
	quadItems,
	clogOnce = 0,
	nextId = 0, 
	birthEnergyCost = 20,
	fightEnergyCost = 20,
	fertileAge = 15;

function init() {
	var quadCanvas = document.getElementById("quadCanvas");

	quadStage      = new Stage(quadCanvas);
	canvas         = document.getElementById("canvas");  //actual game canvas
	ctx            = canvas.getContext("2d");
	CHEIGHT        = canvas.height;
	CWIDTH         = canvas.width;

	var check = document.getElementById("showQuadCheck");
	check.onclick = function(e)
	{
		if(e.target.checked)
		{
			showOverlay = true;
		}
		else
		{
			shape.graphics.clear();
			quadStage.update();
			showOverlay = false;
		}
	};
	
	//url parameter
	var params = parseGetParams();
	var countParam = params.count;
	if(countParam)
	{
		var creepCount = parseInt(countParam);
		
		if(creepCount)
		{
			initialCreepCount = creepCount;
		}
	}	

	//quad tree setup
	bounds = new Rectangle(0, 0, quadCanvas.width, quadCanvas.height);
	shape  = new Shape();
	tree   = new QuadTree(bounds, false, 12);
	
	quadStage.addChild(shape);

    statsCounter = {
		day: 0,
		month: 0,
		alive: 0,
		dead: 0,
		male: 0,
		female: 0,
		age_avg: 0,
		age_max: 0,
		gen_max: 0
    };

    //fetch stats DOM elements
    statsElements = {
		day: $('aside #day'),
		month: $('aside #month'),
		alive: $('aside #alive'),
		dead: $('aside #dead'),
		male: $('aside #male'),
		female: $('aside #female'),
		age_avg: $('aside #age_avg'),
		age_max: $('aside #age_max'),
		gen_max: $('aside #gen_max')
	};

    //populate 
    creeps = generateCreeps(initialCreepCount, 0);
    food = new FoodObj();

	creepCount = initialCreepCount;    

	quadStage.update();
    gameLoaded();
}

function generateCreeps(count, generation, energy) {
	var creepArr = new Array();

    for(var i=0; i<count; i++) {
		creepArr[i] = new CreepObj(nextId, randomXToY(0, CWIDTH-CREEP_SIZE), randomXToY(0, CHEIGHT-CREEP_SIZE));
		creepArr[i].getGender();
		creepArr[i].getColor();
		creepArr[i].getStepStyle();
		creepArr[i].generation = generation;
		(energy) ? creepArr[i].energy = energy : false;

		//update stats + initialCreepCount alive
		statsElements.alive.html(++statsCounter.alive);
		nextId++;
	}

	return creepArr;
}

function gameLoaded() {
    /* mrdoobs Stats*/
        var statsDoob = new Stats();
        // Align top-left
        statsDoob.getDomElement().style.position = 'absolute';
        statsDoob.getDomElement().style.left = '0px';
        statsDoob.getDomElement().style.bottom = '0px';
        document.body.appendChild( statsDoob.getDomElement() );
        setInterval( function () {
            statsDoob.update();
        }, 1000 / 60 );
    /*mrdoobs Stats End */

    //start gameLoop
    gameUpdate();
}

function gameUpdate() {
	if(creeps.length) {
	    //draw
	    draw();

	    //update data
		logicUpdate();

	    //loop
	    requestAnimationFrame(gameUpdate);
	} else {
	    // clear canvas
   		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = '#ccc';
		ctx.font = 'italic bold 20px sans-serif';
		ctx.textBaseline = 'bottom';
		ctx.fillText('All creeps are dead', 300, 200);
	}
}

function logicUpdate() {
	tree.clear();

	//check if a creep tick has passed
	if(creepTicks >= creepTickLength) {
		foodTicks++;
		//update stats + 1 day
		statsElements.day.html(++statsCounter.day);
		creepTicks = 0;
	}

	//update food position every food tick
	if(foodTicks >= foodTickLength) {
		food.spawn();
		//update stats + 1 month
		statsElements.month.html(++statsCounter.month);
		//get food bounding box for collision detection
		foodBox = [food.posX, food.posY, food.posX + FOOD_SIZE, food.posY + FOOD_SIZE];
		foodTicks = 0;
	}

	//update creep data
	for(var i=0; i < creeps.length; i++) {
		if(creeps[i].energy > 0) {
			creeps[i].move();

			//update age and energy every creep tick
			if(creepTicks === 0) {
				creeps[i].age++;
				creeps[i].energy--;
			}

		} else if (creeps[i].isAlive === 1){
			creeps[i].color = deadColor;
			creeps[i].isAlive = 0;

			// console.log(creeps[i].id,':died');
			//update stats
			statsElements.dead.html(++statsCounter.dead);
			statsElements.alive.html(--statsCounter.alive);
		}
		
		if(food.isAlive === 1) {
			//check for collision / did creep box overlapped the food box?
			if(boxIntersectCheck(creepBox, foodBox)){
				creeps[i].energy += food.energy;
				food.isAlive = 0;
				// console.log(creeps[i].id,':gotFood');
			}
		}

		//insert creep position to quadTree
		tree.insert({
			x: creeps[i].posX, 
			y: creeps[i].posY,
			height: CREEP_SIZE,
			width: CREEP_SIZE,
			id: creeps[i].id
		});

		//get creep bounding box for collision detection
		creepBox = [creeps[i].posX, creeps[i].posY, creeps[i].posX + CREEP_SIZE, creeps[i].posY + CREEP_SIZE];

		//check creeps on this position in quadTree		 
		var quadItems = tree.retrieve({x: creeps[i].posX, y: creeps[i].posY, height: CREEP_SIZE, width: CREEP_SIZE});
		var c         = creeps[i];
		var len       = quadItems.length;
		var encounter;
		var collidingCreep;

		if(creeps[i].isAlive && !creeps[i].isFertilized) {
			//build lookup table to find creeps by id
			var creepLookupTable = buildLookupTable(creeps);

			//loop through all creeps in the node/subnode and perform collision detection
			for(var j = 0; j < len; j++) {
				var item = quadItems[j];
				
				if(creeps[i].id == item.id || creeps[i].isCollidingWith == item.id)
				{
					continue;
				}

				var itemBox = [item.x, item.y, item.x + item.width, item.y + item.height];
				
				// check for collision / did creeps in this node overlap?
				if(boxIntersectCheck(creepBox, itemBox)) {
					collidingCreep = creepLookupTable[item.id];
					creeps[i].isCollidingWith = collidingCreep.id;
					
					//check if the colliding creeps is dead already
					if(!collidingCreep.isAlive) {
						//dead creep involved, do nothing for now
					} else {
						//check if collision between two males
						if(creeps[i].gender === 1 && collidingCreep.gender === 1 ) {
							encounter = 'mm';					
						} else if (creeps[i].gender !== collidingCreep.gender) {
							encounter = 'mw';
						}
					}
				}
			}	
		}


		//check for type of encounter
		if(encounter == 'mm') { //if two males meet there is a chane that one of them (50/50) gets ripped its energy by the other
			if(Math.random() < 0.1) {
				if(Math.random() < 0.5) {
					collidingCreep.energy += (creeps[i].energy - fightEnergyCost); 
					creeps[i].energy = 0;
					// console.log(creeps[i].id,':eliminated');
				} else {
					creeps[i].energy += (collidingCreep.energy - fightEnergyCost);
					collidingCreep.energy = 0;
					// console.log(collidingCreep.id,':eliminated');
				}
			}
		} else if (encounter == 'mw') { //male/female encounter, chance of making the female pregnant
			var generation;
			if(Math.random() < 0.1) {
				if(( creeps[i].gender === 0 && collidingCreep.gender === 1 ) && creeps[i].isFertilized === 0 && (creeps[i].age >= fertileAge && collidingCreep.age >= fertileAge)) {
					//creeps[i] is the female, make it pregnant
					creeps[i].isFertilized = 1;
					//reduce energy (will be passed to child)
					creeps[i].energy = creeps[i].energy / 2;
					generation = creeps[i].generation + 1;

					// console.log(creeps[i].id,':fertilized');
				} else if (( creeps[i].gender === 1 && collidingCreep.gender === 0 ) && collidingCreep.isFertilized === 0 && (creeps[i].age >= fertileAge && collidingCreep.age >= fertileAge)) {
					//collidingCreep is the female, make it pregnant
					collidingCreep.isFertilized = 1;
					//reduce energy (will be passed to child)
					collidingCreep.energy = collidingCreep.energy / 2;
					generation = collidingCreep.generation + 1;

					// console.log(collidingCreep.id,':fertilized');
				}

				//generate a new creep and let it start with an energy pool chopped of its parents
				var newCreep = generateCreeps(1, generation, Math.floor(creeps[i].energy + collidingCreep.energy) - birthEnergyCost);
				creeps.push(newCreep[0]);
				// console.log(newCreep[0].id,':born');
			}
		}

		encounter = '';
	}

	if(showOverlay)	{
		renderQuad();
		quadStage.update();
	}

	creepTicks++;
}

function draw() {
    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

	var male = 0, female = 0, age_max = 0, age_sum = 0, age_avg = 0;

	//draw those creeps
	for(var i=0; i < creeps.length; i++) {
		if(creeps[i].isAlive === 0 && creeps[i].ticksSinceDeath <= ticksToVanish ) {
			if(creeps[i].ticksSinceDeath >= ticksToVanish) {
				//creep is dead and has decayed (ticksToVanish passed) - remove from array
				creeps.splice(i,1);
			} else {
				creeps[i].draw();
				creeps[i].ticksSinceDeath++;
			}
		} else {
			creeps[i].draw();

			//grap a few stats
			if(creeps[i].gender) {male++} else {female++};
			age_sum += creeps[i].age;
			(statsCounter.gen_max < creeps[i].generation) ? statsCounter.gen_max = creeps[i].generation : false;
			(age_max < creeps[i].age) ? age_max = creeps[i].age : false; 
		}
	}

	age_avg = age_sum / (male+female);
	//update stats
	statsElements.male.html(male);
	statsElements.female.html(female);
	statsElements.age_avg.html(Math.floor(age_avg));
	statsElements.age_max.html(Math.floor(age_max));
	statsElements.gen_max.html(statsCounter.gen_max);

	//only draw the food if it has spawned
	if(food.isAlive === 1) {
		food.draw();
	}
}

function renderQuad() 
{
	var g = shape.graphics;
	g.clear();
	g.setStrokeStyle(1);
	g.beginStroke("#fff");
	
	drawNode(tree.root);
}

function drawNode(node) 
{
	var bounds = node._bounds;
	var g = shape.graphics;

	g.drawRect(
			abs(bounds.x)  + 0.5,
			abs(bounds.y) + 0.5,
			bounds.width,
			bounds.height
		);
	
	var len = node.nodes.length;
	
	for(var i = 0; i < len; i++)
	{
		drawNode(node.nodes[i]);
	}
}

//fast Math.abs
function abs(x)
{
	return (x < 0 ? -x : x);
}

function parseGetParams()
{
	var getData = new Array();
	var sGet = window.location.search;
	if (sGet)
	{
	    sGet = sGet.substr(1);

	    var sNVPairs = sGet.split("&");

	    for (var i = 0; i < sNVPairs.length; i++)
	    {

	        var sNV = sNVPairs[i].split("=");
	        
	        var sName = sNV[0];
	        var sValue = sNV[1];
	        getData[sName] = sValue;
	    }
	}
	
	return getData;
}
//function to get random number upto m
function randomXToY(minVal,maxVal,floatVal) 
{
  var randVal = minVal+(Math.random()*(maxVal-minVal));
  return typeof floatVal=='undefined'?Math.round(randVal):randVal.toFixed(floatVal);
}

//collision detection seperate axis theorem
function boxIntersectCheck(a,b) 
{
	if(a[0] > b[2] || b[0] > a[2] || a[1] > b[3] || b[1] > a[3]) {
		return false;
	} else {
		return true;
	}
}

//search for element in array by iD
function findById(source, id) 
{
    // return source.filter(function( obj ) {
    //     // coerce both obj.id and id to numbers 
    //     // for val & type comparison
    //     return +obj.id === +id;
    // })[ 0 ];

	return $.grep(source, function(e) {
	  	return e.id == id;
	})[0];

	// return found;
}



function buildLookupTable(arr) {
	var lookup = {};
	for (var i = 0, c = arr.length; i < c; i++) {
	    lookup[arr[i].id] = arr[i];
	}
	return lookup;
}