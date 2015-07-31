function CreepObj(id, x, y) {
	this.id     = id;
	this.age    = 0;
	this.energy = randomXToY(energyRangeA,energyRangeB);
	this.posX   = x;
	this.posY   = y;
	this.isAlive = 1;
	this.ticksSinceDeath = 0;
	this.isCollidingWith = 0;
	this.isFertilized = 0;
	this.generation = 0;

    this.draw = function() {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.posX, this.posY, CREEP_SIZE, CREEP_SIZE); 
	}
}

CreepObj.prototype.getGender = function() {
	if(Math.random() > 0.50){
		this.gender = 0;
	} else {
		this.gender = 1;
	}
};

// return 1,2,3 depdening on random value and defined outcome ranges
CreepObj.prototype._random123 = function() {
	var randomVal = Math.random();

	if(randomVal < 0.15){
		return 0;
	} else if (randomVal < 0.8) {
		return 1;
	} else {
		return 2;
	}
};

CreepObj.prototype.getStepStyle = function() {
	//set step style, will act as multiplier while moving (0x, 1x, 2x; some creeps cant move at all, some only on one axis etc.)
	this.stepX = this._random123();
	this.stepY = this._random123();
};

CreepObj.prototype.getColor = function() {
	if(this.gender === 0) {
		this.color = femaleColor;
	} else {
		this.color = maleColor;
	}
};

CreepObj.prototype.move = function() {
	//determine if creep will move
	if(Math.random() < 0.5) {
		//determin axis on which to move
		if(Math.random() > 0.5) {
		//x
			//determin direction
			if(Math.random() > 0.5) {
			//forward
				//check for border collision
				if(this.posX + CREEP_SIZE * this.stepX > CWIDTH - CREEP_SIZE){
					//hit right X border - not moving
				} else {
					this.posX += CREEP_SIZE * this.stepX;
				}
			 } else {
			//backward
				//check for border collision
				if(this.posX - CREEP_SIZE * this.stepX < 0) {
					//hit left X border - not moving
				} else {
					this.posX -= CREEP_SIZE * this.stepX;
				}
			}
		} else {
		//y
			//determin direction
			if(Math.random() > 0.5){
			//forward
				//check for border collision
				if(this.posY + CREEP_SIZE * this.stepY > CHEIGHT - CREEP_SIZE){
					//hit right Y border - not moving
					this.posY -= CREEP_SIZE * this.stepY;
				} else {
					this.posY += CREEP_SIZE * this.stepY;
				}
			} else {
			//backward
				//check for border collision
				if(this.posY - CREEP_SIZE * this.stepY < 0){
					//hit left Y border - not moving
					this.posY += CREEP_SIZE * this.stepY;
				} else {
					this.posY -= CREEP_SIZE * this.stepY;
				}
			}
		}
	}
};
