function FoodObj () {
	// this.id     = id;
	this.draw  = doDraw;
	this.color = foodColor;
	this.isAlive = 0;
	this.energy = 50;

	function doDraw () {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.posX, this.posY, FOOD_SIZE, FOOD_SIZE); 
	}
};

FoodObj.prototype.spawn = function() {
	this.isAlive = 1;
	this.posX = randomXToY(0, CWIDTH-FOOD_SIZE);
	this.posY = randomXToY(0, CHEIGHT-FOOD_SIZE);
};