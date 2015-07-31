function FoodObj() {
    // this.id     = id;

    this.color = foodColor;
    this.isAlive = 0;
    this.energy = 50;

    this.draw = function() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.posX, this.posY, FOOD_SIZE, FOOD_SIZE);
    }
}

FoodObj.prototype.spawn = function () {
    this.isAlive = 1;
    this.posX = randomXToY(0, canvasWidth - FOOD_SIZE);
    this.posY = randomXToY(0, canvasHeight - FOOD_SIZE);
};
