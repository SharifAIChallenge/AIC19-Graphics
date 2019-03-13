// gameHandler.js
/*jshint esversion: 6*/
var GameHandler = pc.createScript('gameHandler');

GameHandler.prototype.initialize = function() {
    // initial values
    this.turn = 0;
    this.play = true;

    this.setTeamNames();

    // global events
    this.app.on('logHandler->gameHandler::handleLine', (line) => this.handleLine(line), this);
    this.app.on('initHandler->gameHandler::initCompleted', () => this.app.fire('gameHandler->logHandler::goToNextTurn'), this);
    this.app.on('counter->gameHandler::counterCompleted', () => {if (this.play) this.app.fire('gameHandler->logHandler::goToNextTurn');}, this);
    this.app.on('uiHandler->gameHandler::pickCompleted', () => this.app.fire('gameHandler->logHandler::goToNextTurn'), this);
    this.app.on('changeSpeed->gameHandler::pauseOrPlay', () => this.changePlayMode(), this);
};

GameHandler.prototype.update = function(dt) {
    if (this.turn === 0) {
        this.app.fire('gameHandler->logHandler::goToNextTurn');
        this.turn++;
    }
};

GameHandler.prototype.changePlayMode = function() {
    this.play = !this.play;
    if (this.play) {
        this.app.fire('gameHandler->logHandler::goToNextTurn');
    }
};

GameHandler.prototype.handleLine = function(line) {
    switch (line.name) {
        case 'init':
            this.fireInitEvents(line.args[0]);
            break;
        case 'pick':
            this.firePickEvents(line.args[0]);
            break;
        case 'move':
            this.fireMoveEvents(line.args[0]);
            break;
        case 'action':
            this.fireActionEvents(line.args[0]);
            break;
        case 'status':
            this.fireStatusEvents(line.args[0]);
            break;
        case 'end':
            this.fireEndEvents(line.args[0]);
            break;
    }
};

GameHandler.prototype.fireInitEvents = function(data) {
    this.app.fire('gameHandler->initHandler::initGame', data);
};

GameHandler.prototype.firePickEvents = function(data) {
    this.app.fire('gameHandler->initHandler::heroesPicked', data);
    this.app.fire('gameHandler->uiHandler::showPick', data.heroes[0], data.heroes[1]);
};

GameHandler.prototype.fireMoveEvents = function(data) {
    this.app.fire('gameHandler->uiHandler::phase', 'move');
    this.app.fire('gameHandler->uiHandler::AP', data.currentAP);
    this.app.fire('gameHandler->actionHandler::moveHeroes', data.movements);
};

GameHandler.prototype.fireActionEvents = function(data) {
    this.app.fire('gameHandler->uiHandler::phase', 'action');
    this.app.fire('gameHandler->uiHandler::console', data.actions);
    this.app.fire('gameHandler->actionHandler::startActions', data.actions);
};

GameHandler.prototype.fireStatusEvents = function(data) {
    this.turn++;
    this.app.fire('gameHandler->variableHandler::changeGameVariables', this.turn, data.heroes, data.scores);
    this.app.fire('gameHandler->actionHandler::respawnHeroes', data.respawnedHeroes);
};

GameHandler.prototype.fireEndEvents = function(data) {
    this.app.fire('gameHandler->uiHandler::phase', 'end');
    this.app.fire('gameHandler->uiHandler::end', data.usedAPs, data.winner, this);
};

GameHandler.prototype.switchPlay = function(event) {
    if (event.key == pc.KEY_SPACE) {
        this.play = !this.play;
        if (this.play) this.app.fire('gameHandler->logHandler::goToNextTurn');
    }
    if (event.key == pc.KEY_TAB) {
        this.changeGameSpeed();
    }
};

GameHandler.prototype.getTurn = function() {
    return this.turn;
};

GameHandler.prototype.setTeamNames = function() {
    var string = window.location.href;
    var team1 = '',team2 = '';
    string = decodeURIComponent(string);
    var x1 = string.indexOf('first_team=');
    var x2 = string.indexOf('&second_team=');

    if (x1 == -1) return;

    team2 = string.slice(x1 + 11, x2);

    team2 = team2.split('+').join(' ');

    team1 = string.slice(x2 + 13, string.length);
    team1 = team1.split('+').join(' ');

    this.app.root.findByName('Team 1 txt').element.text = team2;
    this.app.root.findByName('Team 1 Text').element.text = team2;
    this.app.root.findByName('Team 2 txt').element.text = team1;
    this.app.root.findByName('Team 2 Text').element.text = team1;
};

// logHandler.js
/*jshint esversion: 6*/
var LogHandler = pc.createScript('logHandler');

/*LogHandler.attributes.add('gameLog', {
    type : 'asset',
    assetType : 'json'
});*/

LogHandler.prototype.initialize = function() {
    // initial values
    this.log = JSON.parse(document.getElementById('storage').innerHTML); // this.gameLog.resources;
    this.line = 0;

    // global events
    this.app.on('gameHandler->logHandler::goToNextTurn', () => this.goToNextTurn(), this);
};

LogHandler.prototype.goToNextTurn = function() {
    if (this.line < this.log.length) {
        var nextLine = this.readLine();
        this.app.fire('logHandler->gameHandler::handleLine', nextLine);
    }
};

LogHandler.prototype.readLine = function() {
    var line = this.log[this.line];
    this.line++;
    return line;
};

// counter.js
/*jshint esversion: 6*/
var Counter = pc.createScript('counter');

Counter.prototype.initialize = function() {
    // initial values
    this.count = 0;

    // global events
    this.app.on('*->counter::countEvents', (count) => this.countEvents(count), this);
    this.app.on('*->counter::endEvent', () => this.endEvent(), this);
};

Counter.prototype.countEvents = function(count) {
    this.count = count;
    if (count === 0) {
        this.app.fire('counter->gameHandler::counterCompleted');
    }
};

Counter.prototype.endEvent = function() {
    this.count--;
    if (this.count === 0) {
        this.app.fire('counter->gameHandler::counterCompleted');
    }
};

// initHandler.js
/*jshint esversion: 6*/
var InitHandler = pc.createScript('initHandler');

InitHandler.prototype.initialize = function() {
    // global events
    this.app.on('gameHandler->initHandler::initGame', (data) => this.initGame(data), this);
    this.app.on('gameHandler->initHandler::heroesPicked', (data) => this.heroesPicked(data), this);
};

InitHandler.prototype.initGame = function(data) {
    this.app.fire('initHandler->variableHandler::initGameConstants', data.gameConstants, data.heroConstants, data.abilityConstants);
    this.app.fire('initHandler->initMap::initMap', data.map);
    this.app.fire('initHandler->gameHandler::initCompleted');
};

InitHandler.prototype.heroesPicked = function(data) {
    this.app.fire('initHandler->initHeroes::initHeroes', data.heroes[0], data.heroes[1]);
};

InitHandler.prototype.setHeroIds = function(data) {
    this.app.fire('initHandler->initConstants::setHeroIds', data);
};


// actionHandler.js
/*jshint esversion: 6*/
var ActionHandler = pc.createScript('actionHandler');

ActionHandler.prototype.initialize = function() {
    // initial values
    this.phase = '';

    // global events
    this.app.on('gameHandler->actionHandler::moveHeroes', (data) => {this.phase = 'move'; this.moveHeroes(data);}, this);
    this.app.on('gameHandler->actionHandler::startActions', (data) => this.startActions(data), this);
    this.app.on('gameHandler->actionHandler::respawnHeroes', (data) => this.respawnHeroes(data), this);
    this.app.on('rotation->actionHandler::endRotation', (data) => {
        if (this.phase == 'move') {
            this.app.fire('actionHandler->movement::moveHero', data);
        }
        if (this.phase == 'attack') {
            this.app.fire('actionHandler->attack::attack', data);
        }
        if (this.phase == 'skill') {
            this.app.fire('actionHandler->skill::skill', data);
        }
    }, this);
};

// move related functions
ActionHandler.prototype.moveHeroes = function(data) {
    var eventCount = 0;
    for (i = 0; i < data.length; i++) {
        if (data[i] != 'n') {
            eventCount++;
        }
    }
    this.app.fire('*->counter::countEvents', eventCount, 'action');
    for (i = 0; i < data.length; i++) {
        if (data[i] != 'n') {
            this.app.fire('actionHandler->rotation::rotate', {id: i, dir: data[i], destination: this.dirToDestination(data[i])}, this);
        }
    }
};

ActionHandler.prototype.dirToDestination = function(dir) {
    switch(dir) {
        case 'l':
            return [-1, 0];
        case 'r':
            return [1, 0];
        case 'd':
            return [0, 1];
        case 'u':
            return [0, -1];
    }
};

// action related functions
ActionHandler.prototype.startActions = function(data) {
    this.app.fire('*->counter::countEvents', data.length);
    for (i = 0; i< data.length; i++) {
        attackType = data[i].ability.split('_')[1];
        switch(attackType) {
            case "DODGE":
                this.app.fire('actionHandler->dodge::dodge', data[i]);
                break;
            case "ATTACK":
                this.phase = 'attack';
                this.app.fire('actionHandler->rotation::rotate', {id: data[i].id, dir: '', destination: [data[i].columnDistance, data[i].rowDistance]}, this);
                break;
            default:
                this.phase = 'skill';
                this.app.fire('actionHandler->rotation::rotate', {id: data[i].id, dir: '', destination: [data[i].columnDistance, data[i].rowDistance]}, this);
                break;
        }
    }
};


ActionHandler.prototype.respawnHeroes = function(data) {
    for (i = 0; i< data.length; i++) {
        this.app.fire('actionHandler->respawn::respawnHeroes', data[i]);
    }
};

// variableHandler.js
/*jshint esversion: 6*/
var VariableHandler = pc.createScript('variableHandler');

VariableHandler.prototype.initialize = function() {
    // global events
    this.app.on('initHandler->variableHandler::initGameConstants', (gameConstants, heroConstants, abilityConstats) => {
        this.gameConstants = gameConstants;
        this.heroConstants = heroConstants;
        this.abilityConstants = abilityConstats;
        this.app.fire('variableHandler->heroConstants::initHeroConstants', heroConstants);
        this.app.fire('variableHandler->gameConstants::initMaxAP', gameConstants.maxAP);
    }, this);
    this.app.on('gameHandler->variableHandler::changeGameVariables', (turn, heroes, scores) => {
        this.changeHeroesStatus(heroes);
        this.app.fire('variableHandler->uiHandler::changeTurn', turn, this);
        this.app.fire('variableHandler->uiHandler::changeScores', scores, this);
        this.app.fire('*->counter::countEvents', 0, 'variable');
    }, this);
};

VariableHandler.prototype.changeHeroesStatus = function(data) {
    for (i = 0; i< data.length; i++) {
        var hero = data[i];
        if (hero.remRespawnTime !== 0) {
            this.app.fire('variableHandler->actionHandler::killHero', hero.id);
        }
        this.app.fire('variableHandler->uiHandler::changeHealthStatus', {id: hero.id, health: hero.currentHP});
        this.app.fire('variableHandler->uiHandler::changeRespawnsStatus', {id: hero.id, remTime: hero.remRespawnTime});
        this.app.fire('variableHandler->uiHandler::changeCooldownStatus', {id: hero.id, remCooldown: hero.remainingCooldowns});
    }
};

// uiHandler.js
/*jshint esversion: 6*/
var UiHandler = pc.createScript('uiHandler');

UiHandler.prototype.initialize = function() {
    // global events
    this.app.on('gameHandler->uiHandler::showPick', (leftHeroes, rightHeroes) => {
        this.app.fire('uiHandler->pickPhase::showPick', leftHeroes, rightHeroes);
        this.app.fire('uiHandler->setMiniPics::setHeroes', leftHeroes, rightHeroes);
    }, this);
    this.app.on('gameHandler->uiHandler::phase', (phase) => this.app.fire('uiHandler->phase::phase', phase), this);
    this.app.on('gameHandler->uiHandler::end', (finalAPs, winner) => this.app.fire('uiHandler->end::end', finalAPs, winner), this);
    this.app.on('gameHandler->uiHandler::AP', (ap) => this.app.fire('uiHandler->ap::apStatus', ap), this);
    this.app.on('gameHandler->uiHandler::console', (actions) => this.app.fire('uiHandler->console::console', actions), this);
    this.app.on('variableHandler->uiHandler::changeTurn', (turn) => this.app.fire('uiHandler->turn::changeTurn', turn), this);
    this.app.on('variableHandler->uiHandler::changeScores', (scores) => this.app.fire('uiHandler->score::changeScores', scores), this);
    this.app.on('variableHandler->uiHandler::changeHealthStatus', (health) => this.app.fire('uiHandler->health::changeHealth', health), this);
    this.app.on('variableHandler->uiHandler::changeRespawnsStatus', (respawn) => this.app.fire('uiHandler->respawn::changeRespawnTime', respawn), this);
    this.app.on('variableHandler->uiHandler::changeCooldownStatus', (cooldown) => this.app.fire('uiHandler->cooldown::changeCooldownStatus', cooldown), this);
    this.app.on('pickPhase->uiHandler::pickCompleted', () => {
        this.app.root.findByName('UI').findByName('Holder').enabled = true;
        this.app.fire('uiHandler->setMiniPics::setPics');
        this.app.fire('uiHandler->gameHandler::pickCompleted');
    }, this);
};

// pickPhase.js
/*jshint esversion: 6*/
var PickPhase = pc.createScript('pickPhase');

PickPhase.attributes.add('timeout', {
    type: 'number',
    default: 3000
});

PickPhase.attributes.add('heroTextures', {
    type: 'asset',
    assetType: 'texture',
    array: true
});

PickPhase.prototype.initialize = function() {
    // global events
    this.app.on('uiHandler->pickPhase::showPick', (leftHeroes, rightHeroes) => this.showPick(leftHeroes, rightHeroes), this);
};

PickPhase.prototype.showPick = function(leftHeroes, rightHeroes) {
    var holder = this.entity.findByName('Holder');
    var pickupBackground = holder.findByName('pickupBackground');
    holder.enabled = true;
    for (var i = 0; i < 4; i++) {
        hero = pickupBackground.findByName('Hero ' + (i + 1));
        enemy = pickupBackground.findByName('Enemy ' + (i + 1));
        hero.element.texture = this.findTexture(leftHeroes[i].name, false);
        enemy.element.texture = this.findTexture(rightHeroes[i].name, true);
    }
    setTimeout(this.finish, this.timeout, this);
};

PickPhase.prototype.findTexture = function(name, flip) {
    for (i = 0; i < 10; i++) {
        if (this.heroTextures[i].name.startsWith(name) === true) {
            var texture = this.heroTextures[i].resource;
            //texture.flipY = flip;
            return texture;
        }
    }
};

PickPhase.prototype.finish = function(self) {
    self.entity.findByName('Holder').enabled = false;
    self.app.fire('pickPhase->uiHandler::pickCompleted');
};

// initHeroes.js
/*jshint esversion: 6*/
var InitHeroes = pc.createScript('initHeroes');

InitHeroes.prototype.initialize = function() {
    // global events
    this.app.on('initHandler->initHeroes::initHeroes', (leftHeroes, rightHeroes) => this.initHeroes(leftHeroes.concat(rightHeroes)), this);
};

InitHeroes.prototype.initHeroes = function(heroes) {
    for (i = 0; i < heroes.length; i++) {
        // setting entity properties
        var unit = new pc.Entity();
        unit = this.app.root.findByName('Pool').findByName(heroes[i].name);
        unit = unit.clone();
        unit.enabled = true;
        for (var j = 0; j < unit.children.length; j++) {
            unit.children[j].enabled = false;
        }
        unit.findByName('Health Bar').enabled = true;
        unit.name = unit.name + heroes[i].id;

        var xPos = (heroes[i].column) * 4 + 2;
        var yPos = (heroes[i].row) * 4 + 2;
        unit.setLocalPosition(xPos, 0, yPos);

        this.entity.addChild(unit);
    }
};

var InitGameConstants=pc.createScript("initGameConstants");InitGameConstants.attributes.add("maxAP",{type:"number"}),InitGameConstants.prototype.initialize=function(){this.app.on("variableHandler->gameConstants::initMaxAP",function(t){this.maxAP=t},this)};var InitHeroConstants=pc.createScript("initHeroConstants");InitHeroConstants.attributes.add("maxHP",{type:"number",default:100}),InitHeroConstants.prototype.initialize=function(){this.app.on("variableHandler->heroConstants::initHeroConstants",this.setMaxHP,this)},InitHeroConstants.prototype.setMaxHP=function(t){for(i=0;i<t.length;i++)t[i].name==this.entity.name&&(this.maxHP=t[i].maxHP)};// initMap.js
/*jshint esversion: 6*/
var InitMap = pc.createScript('initMap');

InitMap.attributes.add('map', {
    type: 'entity',
});

InitMap.attributes.add('groundModel', {
    type: 'asset',
    assetType: 'model',
});

InitMap.attributes.add('objectiveModel', {
    type: 'asset' ,
    assetType: 'model',
});

InitMap.attributes.add('spawnModel', {
    type: 'asset' ,
    assetType: 'model',
});

InitMap.attributes.add('wallModel1', {
    type: 'asset',
    assetType: 'model',
});

InitMap.attributes.add('wallModel2', {
    type: 'asset',
    assetType: 'model',
});

InitMap.attributes.add('wallModel3', {
    type: 'asset',
    assetType: 'model',
});

InitMap.attributes.add('wallModel4', {
    type: 'asset',
    assetType: 'model',
});

InitMap.attributes.add('wallModel5', {
    type: 'asset',
    assetType: 'model',
});

InitMap.attributes.add('wallModel6', {
    type: 'asset',
    assetType: 'model',
});

InitMap.attributes.add('random1', {
    type: 'asset',
    assetType: 'material',
});

InitMap.attributes.add('random2', {
    type: 'asset',
    assetType: 'material',
});

InitMap.attributes.add('random3', {
    type: 'asset',
    assetType: 'material',
});

InitMap.attributes.add('random4', {
    type: 'asset',
    assetType: 'material',
});

InitMap.attributes.add('random5', {
    type: 'asset',
    assetType: 'material',
});

InitMap.prototype.initialize = function() {
    // global events
    this.app.on('initHandler->initMap::initMap', (map) => this.initMap(map, this.getMapString(map)), this);
};

InitMap.prototype.initMap = function(map, content) {
    var ground = this.entity.findByName('Ground');
    var blocks = this.entity.findByName('Blocks');
    var floormodel = this.groundModel;
    
    for(var index = 0; index < content.length; index++) {
        var x = this.getXZ(map,index)[0];
        var z = this.getXZ(map,index)[1];
        if(content[index] == 'w') {
            var wallModels = [this.wallModel1, this.wallModel2, this.wallModel3, this.wallModel4, this.wallModel5, this.wallModel6];
            var selectedWallModel = wallModels[Math.floor(Math.random() * 6)];
            this.addToMap('wall', selectedWallModel, blocks, x, 0, z);
            this.addToMap('ground', this.groundModel, ground, x, 0, z);
        }
        else if(content[index] == 'g') {
            this.addToMap('ground', this.groundModel, ground, x, 0, z);
        }
        else if(content[index] == 'o') {
            this.addToMap('objective', this.objectiveModel, ground, x, 0, z);
        }
        else if(content[index] == 's') {
            this.addToMap('spawn', this.spawnModel, ground, x, 0, z);
        }
        else if (content[index] == 'm') {
            var wallModels1 = [this.wallModel1, this.wallModel2, this.wallModel3, this.wallModel4, this.wallModel5, this.wallModel6];
            var selectedWallModel1 = wallModels1[Math.floor(Math.random() * 6)];
            this.addToMap('wall', selectedWallModel1, blocks, x, 0, z);
            this.addToMap('spawn', this.spawnModel, ground, x, 0, z);
        }
        else if (content[index] == 'n') {
            var wallModels2 = [this.wallModel1, this.wallModel2, this.wallModel3, this.wallModel4, this.wallModel5, this.wallModel6];
            var selectedWallModel2 = wallModels2[Math.floor(Math.random() * 6)];
            this.addToMap('wall', selectedWallModel2, blocks, x, 0, z);
            this.addToMap('objective', this.objectiveModel, ground, x, 0, z);
        }
        else {
            // console.error('none\n');
        }
    }
};

InitMap.prototype.getMapString = function(map) {
    var content = map.cells;
    map = '';
    for (var i = 0; i < content.length; i++) {
        for (var j = 0; j < content[0].length; j++) {
            if (content[i][j].isWall && !content[i][j].isInFirstRespawnZone && !content[i][j].isInSecondRespawnZone && !content[i][j].isInObjectiveZone) {
                map += 'w';
            }
            else if (!content[i][j].isWall && content[i][j].isInFirstRespawnZone) {
                map +='s';
            }
            else if (!content[i][j].isWall && content[i][j].isInSecondRespawnZone) {
                map +='s';
            }
            else if (!content[i][j].isWall && content[i][j].isInObjectiveZone) {
                map +='o';
            }
            else if (content[i][j].isWall && content[i][j].isInFirstRespawnZone) {
                map +='m';
            }
            else if (content[i][j].isWall && content[i][j].isInSecondRespawnZone) {
                map +='m';
            }
            else if (content[i][j].isWall && content[i][j].isInObjectiveZone) {
                map +='n';
            }
            else {
                map +='g';
            }
        }
    }
    return map;
};

InitMap.prototype.addToMap = function(name, model, parent, x, y, z) {
    var add = new pc.Entity();
    add.name = name;
    add.addComponent('model');
    add.model.type = 'asset';
    add.model.asset = model;
    
    // performance
    add.model.batchGroupId = 100002;
    if (add.name != 'wall') {
        add.model.castShadows = false;
        add.model.castShadowsLightmap = false;
    }
    if (add.name == 'ground') {
        switch (Math.floor(Math.random() * 5)) {
            case 0: add.model.meshInstances[0].material = this.random1.resource; break;
            case 1: add.model.meshInstances[0].material = this.random2.resource; break;
            case 2: add.model.meshInstances[0].material = this.random3.resource; break;
            case 3: add.model.meshInstances[0].material = this.random4.resource; break;
            case 4: add.model.meshInstances[0].material = this.random5.resource; break;
        }
    }
    
    add.setPosition(x, y, z);
    parent.addChild(add);
};

InitMap.prototype.getXZ = function(map, index) {
    var size = this.getSize(map);
    var i = Math.floor(index / size);
    var j = index % size;
    var x = -2 * size + 4 * i + 66;
    var z = -2 * size + 4 * j + 62;
    return [z, x];
};

InitMap.prototype.getSize = function(map) {    
    return map.rowNum;
};

var Animations=pc.createScript("animations");Animations.states={idle:{animation:"idle.json"},walking:{animation:"walking.json"},skill:{animation:"skill.json"},attack:{animation:"attack.json"},attack2:{animation:"attack2.json"},attack3:{animation:"attack3.json"},attack4:{animation:"attack4.json"}},Animations.prototype.initialize=function(){this.state="idle",this.setState("idle")},Animations.prototype.setState=function(t,a){var i=Animations.states;this.state=t,this.entity.animation.play(i[t].animation,a/this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed())};// rotation.js
/*jshint esversion: 6*/
var Rotation = pc.createScript('rotation');

Rotation.attributes.add('rotationSpeed', {
    type : 'number',
    default : 100
});

Rotation.prototype.initialize = function() {
    // initial values
    this.actionRotate = false;
    this.direction = '';
    this.destinationX = 0;
    this.destinationY = 0;

    // global events
    this.app.on('actionHandler->rotation::rotate', (data) => {
        if (this.entity.name[this.entity.name.length - 1] == data.id) {
            this.actionRotate = true;
            this.direction = data.dir;
            this.destinationX = data.destination[0];
            this.destinationY = data.destination[1];
            this.rotate();
        }
    }, this);
};

Rotation.prototype.rotate = function() {
    if (this.destinationX !== 0 || this.destinationY !== 0) {
        var position = this.entity.getPosition();
        this.entity.lookAt(position.x + this.destinationX, 0,position.z + this.destinationY);
        this.entity.findByName('Health Bar').lookAt(position.x + 1, 3, position.z + 1);
    }
    this.app.fire('rotation->actionHandler::endRotation', {id: this.entity.name[this.entity.name.length - 1], dir: this.direction, destinationX: this.destinationX, destinationY: this.destinationY}, this);
};

Rotation.prototype.calculateRotationAngle = function() {
    var initialAngle = this.getRotation(this.entity.getRotation());
    var asin = Math.asin(this.destinationX / (Math.pow(this.destinationX, 2) + Math.pow(this.destinationY, 2))) * pc.math.RAD_TO_DEG;
    var acos = Math.asin(this.destinationY / (Math.pow(this.destinationX, 2) + Math.pow(this.destinationY, 2))) * pc.math.RAD_TO_DEG;
    var angle = 0;
    if (asin >= 0 && acos >= 0) {
        angle = asin;
    }
    else if (asin >= 0 && acos >= 0) {
        angle = 180 - asin;
    }
    else if (asin <= 0 && acos <= 0) {
        angle = -180 - asin;
    }
    else {
        angle = asin;
    }
    return initialAngle - angle;
};

Rotation.prototype.getRotation = function(quat) {
    var transformedForward = new pc.Vec3();
    quat.transformVector(pc.Vec3.FORWARD, transformedForward);
    angle = Math.atan2(-transformedForward.x, -transformedForward.z) * pc.math.RAD_TO_DEG;
    return angle >= 0 ? 180 - angle : -1 * (180 + angle);
};

// movement.js
/*jshint esversion: 6*/
var Movement = pc.createScript('movement');

Movement.attributes.add('moveTime', {
    type: 'number'
});

Movement.attributes.add('movementCorrection', {
    type: 'number'
});
Movement.prototype.initialize = function() {
    // initial values
    this.animation = this.entity.script.animations;
    this.actionMove = false;
    this.isWalking = false;
    this.direction = '';
    this.time = 0;

    // global events
    this.app.on('actionHandler->movement::moveHero', (data) => {
        if (this.entity.name[this.entity.name.length - 1] == data.id) {
            this.actionMove = true;
            this.direction = data.dir;
        }
    }, this);
};

Movement.prototype.update = function(dt) {
    this.time += dt;
    var pos, vec;
    if (this.actionMove) {
        this.time = 0;
        this.animation.setState('walking', 0.2);
        this.pos0 = new pc.Vec3(this.entity.getPosition().x, this.entity.getPosition().y, this.entity.getPosition().z);
        this.actionMove = false;
        this.isWalking = true;

    }
    else if (this.isWalking && this.time < this.moveTime / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed()) {
        pos = this.entity.getPosition();
        delta = this.movementCorrection * dt * this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed();
        var healthBar = new pc.Entity();
        healthBar = this.entity.findByName('Health Bar');
        var healthBarDelta = 0.6;
        switch (this.direction) {
            case 'l':
                this.entity.setPosition(pos.x - delta, pos.y, pos.z);
                healthBar.setPosition(pos.x - healthBarDelta, pos.y + 7, pos.z);
                break;
            case 'r':
                this.entity.setPosition(pos.x + delta, pos.y, pos.z);
                healthBar.setPosition(pos.x + healthBarDelta, pos.y + 7, pos.z);
                break;
            case 'u':
                this.entity.setPosition(pos.x, pos.y, pos.z - delta);
                healthBar.setPosition(pos.x, pos.y + 7, pos.z - healthBarDelta);
                break;
            case 'd':
                this.entity.setPosition(pos.x, pos.y, pos.z + delta);
                healthBar.setPosition(pos.x, pos.y + 7, pos.z + healthBarDelta);
                break;
        }
    }
    else if (this.isWalking && this.time >= this.moveTime / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed()) {
        this.animation.setState('idle', 0);
        this.isWalking = false;
        switch (this.direction) {
            case 'l':
                this.entity.setPosition(this.pos0.x - 4, this.pos0.y, this.pos0.z);
                break;
            case 'r':
                this.entity.setPosition(this.pos0.x + 4, this.pos0.y, this.pos0.z);
                break;
            case 'u':
                this.entity.setPosition(this.pos0.x, this.pos0.y, this.pos0.z - 4);
                break;
            case 'd':
                this.entity.setPosition(this.pos0.x, this.pos0.y, this.pos0.z + 4);
                break;
        }
        this.app.fire('*->counter::endEvent');
    }
};

var HealthBar=pc.createScript("healthBar");HealthBar.prototype.initialize=function(){this.parent=new pc.Entity,this.parent=this.entity.parent,this.maxHP=10,this.barWidth=this.entity.element.width,this.maxHPDefined=!1,this.app.on("uiHandler->health::changeHealth",this.onHealthChange,this)},HealthBar.prototype.setMaxHP=function(){heroName=this.parent.name.substring(0,this.parent.name.length-1);var t=new pc.Entity;for(t=this.app.root.findByName("Pool"),i=0;i<t.children.length;i++)t.children[i].name==heroName&&(this.maxHP=t.children[i].script.initHeroConstants.maxHP)},HealthBar.prototype.onHealthChange=function(t){this.maxHPDefined||(this.setMaxHP(),this.maxHPDefined=!0);var e=this.parent.name[this.parent.name.length-1];t.id==e&&(this.entity.element.width=this.barWidth*t.health/this.maxHP,this.entity.element.color=new pc.Color(t.health/this.maxHP<.4?1:0,t.health/this.maxHP>.3?1:0,0))};// attack.js
/*jshint esversion: 6*/
var Attack = pc.createScript('attack');

Attack.attributes.add('attackTime', {
    type: 'number'
});
Attack.attributes.add('soldierAttackTime2', {
   type: 'number'
});

Attack.attributes.add('soldierAttackTime3', {
   type: 'number'
});

Attack.attributes.add('soldierAttackTime4', {
    type: 'number'
});

Attack.prototype.initialize = function() {
    this.animation = this.entity.script.animations;
    this.app.on('actionHandler->attack::attack', (data) => {
        if (this.entity.name[this.entity.name.length - 1] == data.id) {
            if (this.entity.name.substring(0, this.entity.name.length - 1) == "Slayer" ||
            this.entity.name.substring(0, this.entity.name.length - 1) == "Red Demon") {
            if (this.destinationX > 3 || this.destinationY > 3) {
                this.animation.setState('attack4', 0.2);
                setTimeout(this.endAttack, this.soldierAttackTime4 * 1000 / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed(), this);
            } else if (this.destinationX > 2 || this.destinationY > 2 ) {
                this.animation.setState('attack3', 0.2);
                setTimeout(this.endAttack, this.soldierAttackTime3 * 1000 / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed(), this);
            } else if (this.destinationX > 1 || this.destinationY > 1 ) {
                this.animation.setState('attack2', 0.2);
                setTimeout(this.endAttack, this.soldierAttackTime2 * 1000 / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed(), this);
            } else {
                this.animation.setState('attack', 0.2);
                setTimeout(this.endAttack, this.attackTime * 1000 / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed(), this);
            }
        } else {
            this.animation.setState('attack', 0.2);
            setTimeout(this.endAttack, this.attackTime * 1000 / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed(), this);
        }
            this.destinationX = data.destinationX;
            this.destinationY = data.destinationY;
        }
        if (this.entity.name.substring(0, this.entity.name.length - 1 ) ==  "Ancient Warrior" ||
            this.entity.name.substring(0, this.entity.name.length - 1 ) ==  "Mechanical Golem" ||
            this.entity.name.substring(0, this.entity.name.length - 1 ) ==  "Mystic" ||
            this.entity.name.substring(0, this.entity.name.length - 1 ) ==  "Ancient Queen"  ) {
            var laserData = {
                id : data.id ,
                destinationX : data.destinationX,
                destinationY : data.destinationY
            };

            this.app.fire('*->lasermaker :: laser' , laserData);
            }
    }, this);
};

Attack.prototype.endAttack = function(self) {
    self.animation.setState('idle');
    self.app.fire('*->counter::endEvent');
};

var Dodge=pc.createScript("dodge");Dodge.attributes.add("dodgeTime",{type:"number"}),Dodge.attributes.add("dodgeSpeed",{type:"number"}),Dodge.prototype.initialize=function(){this.start=!1,this.y0=this.entity.getPosition().y,this.portaly0=this.entity.findByName("portal").getPosition().y,this.app.on("actionHandler->dodge::dodge",function(t){this.entity.name[this.entity.name.length-1]==t.id&&(this.time=0,this.start=!0,this.data=t)},this)},Dodge.prototype.update=function(t){this.time+=t,this.start&&this.time<this.dodgeTime/this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed()?(this.entity.findByName("portal").enabled=!0,this.entity.setPosition(this.entity.getPosition().x,this.entity.getPosition().y-this.dodgeSpeed*t*this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed(),this.entity.getPosition().z),this.entity.findByName("portal").setPosition(this.entity.getPosition().x,this.portaly0,this.entity.getPosition().z)):this.start&&this.time>=this.dodgeTime/this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed()&&this.time<this.dodgeTime/this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed()+t&&this.entity.findByName("portal").enabled?(this.entity.findByName("portal").enabled=!1,this.entity.setPosition(this.entity.getPosition().x+4*this.data.columnDistance,this.entity.getPosition().y,this.entity.getPosition().z+4*this.data.rowDistance)):this.start&&this.time<2*this.dodgeTime/this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed()?(this.entity.findByName("portal").enabled=!0,this.entity.setPosition(this.entity.getPosition().x,this.entity.getPosition().y+this.dodgeSpeed*t*this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed(),this.entity.getPosition().z),this.entity.findByName("portal").setPosition(this.entity.getPosition().x,this.portaly0,this.entity.getPosition().z)):this.start&&this.time>=2*this.dodgeTime/this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed()&&(this.entity.setPosition(this.entity.getPosition().x,this.y0,this.entity.getPosition().z),this.start=!1,this.entity.findByName("portal").enabled=!1,this.app.fire("*->counter::endEvent"))};var Skill=pc.createScript("skill");Skill.attributes.add("skillTime",{type:"number"}),Skill.prototype.initialize=function(){this.animation=this.entity.script.animations,this.time=0,this.isSkill=0,this.actionSkill=!1,this.app.on("actionHandler->skill::skill",function(t){if(this.entity.name[this.entity.name.length-1]==t.id&&(this.actionSkill=!0,this.destinationX=t.destinationX,this.destinationY=t.destinationY,"Ancient Warrior"==this.entity.name.substring(0,this.entity.name.length-1)||"Mechanical Golem"==this.entity.name.substring(0,this.entity.name.length-1))){var i={id:t.id,destinationX:this.destinationX,destinationY:this.destinationY};this.app.fire("*->lasermaker :: laser",i)}"Red Demon"==this.entity.name.substring(0,this.entity.name.length-1)&&this.app.fire("skill -> bombmaker :: make",t),"Big Ork"!=this.entity.name.substring(0,this.entity.name.length-1)&&"Elemental Golem"!=this.entity.name.substring(0,this.entity.name.length-1)||this.app.fire("*->fortify :: fortify",t),"Mystic"!=this.entity.name.substring(0,this.entity.name.length-1)&&"Ancient Queen"!=this.entity.name.substring(0,this.entity.name.length-1)||this.app.fire("*->healer :: skill",t),"Spirit Demon"!=this.entity.name.substring(0,this.entity.name.length-1)&&"Evil God"!=this.entity.name.substring(0,this.entity.name.length-1)||this.app.fire("skillGhost",t)},this)},Skill.prototype.update=function(t){this.time+=t,this.actionSkill?(this.time=0,this.animation.setState("skill",.2),this.actionSkill=!1,this.isSkill=!0):this.isSkill&&this.time>=this.skillTime/this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed()&&(this.animation.setState("idle",0),this.isSkill=!1,this.app.fire("*->counter::endEvent"))};// kill.js
/*jshint esversion: 6*/
var Kill = pc.createScript('kill');

Kill.prototype.initialize = function() {

    this.app.on('variableHandler->actionHandler::killHero', (id) => {
        if (this.entity.name[this.entity.name.length - 1] == id) {
            this.kill();
        }
    }, this);
};

Kill.prototype.kill = function() {
    this.entity.setPosition(-100, 0, -100);
};


// respawn.js
/*jshint esversion: 6*/
var Respawn = pc.createScript('respawn');

Respawn.prototype.initialize = function() {
    this.app.on('actionHandler->respawn::respawnHeroes', (data) => this.respawnHeroes(data), this);
};
    
Respawn.prototype.respawnHeroes = function(data) {
    if (this.entity.name[this.entity.name.length - 1] == data.id) {
        var xPos = (data.column) * 4 + 2;
        var yPos = (data.row) * 4 + 2;
        this.entity.setLocalPosition(xPos, 0, yPos);
        var meshs = this.entity.model.model.meshInstances;
        for (var i = 0; i < meshs.length; i++) {
            this.alpha = 0.4;
            meshs[i].setParameter("material_opacity", 1);
        }
    }  
};


// phase.js
/*jshint esversion: 6*/
var Phase = pc.createScript('phase');

Phase.prototype.initialize = function() {
    this.app.on('uiHandler->phase::phase', (phase) => this.onPhaseChanged(phase), this);
};

Phase.prototype.onPhaseChanged = function(phase) {
    if (phase == 'move' || phase == 'action' || phase == 'end')
        if (this.entity.name == 'Phase txt')
            this.entity.element.text = phase;
    if (phase == 'end'){
        var endScene = new pc.Entity();
        endScene = this.app.root.findByName('Winner Loser Frame');
        endScene.enabled = true;
    }
};


// score.js
/*jshint esversion: 6*/
var Score = pc.createScript('score');

Score.prototype.initialize = function() {
    this.app.on('uiHandler->score::changeScores', (scores) => this.onScoreChanged(scores), this);
};

Score.prototype.onScoreChanged = function (score) {
    if (this.entity.name == 'Hero Score txt')
        this.entity.element.text = score[0] + "";
    else if (this.entity.name == 'Enemy Score txt')
        this.entity.element.text = score[1] + "";
};


var Turn=pc.createScript("turn");Turn.prototype.initialize=function(){this.app.on("uiHandler->turn::changeTurn",this.onTurnChanged,this)},Turn.prototype.onTurnChanged=function(n){this.entity.element.text=n};// AP.js
/*jshint esversion: 6*/
var Ap = pc.createScript('ap');

Ap.prototype.initialize = function() {
    this.maximumAP = 0;
    this.maxAPDefined = false;
    this.barHeight = this.entity.element.height;
    //this.app.on('uiHandler->ap::initMaxAP', (maxAP) => this.initMaxAP(maxAP), this);
    this.app.on('uiHandler->ap::apStatus', (ap) => this.apStatus(ap), this);
};

Ap.prototype.initMaxAP = function() {
    var root = new pc.Entity();
    root = this.app.root.findByName('Root');
    this.maximumAP = root.script.initGameConstants.maxAP;
};

Ap.prototype.apStatus = function(ap) {
    if (!this.maxAPDefined) {
        this.initMaxAP();
        this.maxAPDefined = true;
    }
        
    if (this.entity.name == 'Hero AP') {
        this.entity.element.height = this.barHeight * ap[0] / this.maximumAP;
    }
    if (this.entity.name == 'Enemy AP') {
        this.entity.element.height = this.barHeight * ap[1]  / this.maximumAP;
    }
};


// setMiniPics.js
/*jshint esversion: 6*/
var SetMiniPics = pc.createScript('setMiniPics');

SetMiniPics.attributes.add('textures', {
    type: "asset",
    assetType: "texture",
    array: true
});

SetMiniPics.prototype.initialize = function() {
    this.app.on('uiHandler->setMiniPics::setHeroes', (leftHeroes, rightHeroes) => {this.leftHeroes = leftHeroes; this.rightHeroes = rightHeroes;}, this);
    this.app.on('uiHandler->setMiniPics::setPics', () => this.setPics(), this);
};

SetMiniPics.prototype.setPics = function() {
    var left = this.entity.findByName('Holder').findByName('Hero Left');
    var right = this.entity.findByName('Holder').findByName('Enemy Right');
    for (var i = 0; i < this.leftHeroes.length; i++) {
        var leftHero = left.findByName('Hero ' + i);
        leftHero.name = this.leftHeroes[i].name + this.leftHeroes[i].id;
        leftHero.element.texture = this.findTexture(leftHero.name, false);
        var rightHero = right.findByName('Enemy ' + i);
        rightHero.name = this.rightHeroes[i].name + this.rightHeroes[i].id;
        rightHero.element.texture = this.findTexture(rightHero.name, true);
    }
};

SetMiniPics.prototype.findTexture = function(name, flip) {
    for (i = 0; i < 10; i++) {
        if (this.textures[i].name.startsWith(name.substring(0, name.length - 1)) === true) {
            var texture = this.textures[i].resource;
            //texture.flipY = flip;
            return texture;
        }
    }
};


var Hover=pc.createScript("hover");Hover.prototype.initialize=function(){this.entity.element.on("mouseenter",this.onMouseEnter,this),this.entity.element.on("mouseleave",this.onMouseLeave,this)},Hover.prototype.update=function(e){},Hover.prototype.onMouseEnter=function(e){var a=this.app.root.findByName("Details Name");if("Attack"==this.entity.name)switch(a.element.text){case"Ancient Queen":case"Mystic":this.app.root.findByName("Healer Attack").enabled=!0;break;case"Mechanical Golem":case"Ancient Warrior":this.app.root.findByName("Sentry Attack").enabled=!0;break;case"Elemental Golem":case"Big Ork":this.app.root.findByName("Guardian Attack").enabled=!0;break;case"Slayer":case"Red Demon":this.app.root.findByName("Blaster Attack").enabled=!0;break;case"Evil God":case"Spirit Demon":this.app.root.findByName("Shadow Attack").enabled=!0}else if("Dodge"==this.entity.name)switch(a.element.text){case"Ancient Queen":case"Mystic":this.app.root.findByName("Healer Dodge").enabled=!0;break;case"Mechanical Golem":case"Ancient Warrior":this.app.root.findByName("Sentry Dodge").enabled=!0;break;case"Elemental Golem":case"Big Ork":this.app.root.findByName("Guardian Dodge").enabled=!0;break;case"Slayer":case"Red Demon":this.app.root.findByName("Blaster Dodge").enabled=!0;break;case"Evil God":case"Spirit Demon":this.app.root.findByName("Shadow Dodge").enabled=!0}else if("Skill"==this.entity.name)switch(a.element.text){case"Ancient Queen":case"Mystic":this.app.root.findByName("Healer Heal").enabled=!0;break;case"Mechanical Golem":case"Ancient Warrior":this.app.root.findByName("Sentry Ray").enabled=!0;break;case"Elemental Golem":case"Big Ork":this.app.root.findByName("Guardian Fortify").enabled=!0;break;case"Slayer":case"Red Demon":this.app.root.findByName("Blaster Bomb").enabled=!0;break;case"Evil God":case"Spirit Demon":this.app.root.findByName("Shadow Slash").enabled=!0}},Hover.prototype.onMouseLeave=function(e){var a=this.app.root.findByName("Details Name");if("Attack"==this.entity.name)switch(a.element.text){case"Ancient Queen":case"Mystic":this.app.root.findByName("Healer Attack").enabled=!1;break;case"Mechanical Golem":case"Ancient Warrior":this.app.root.findByName("Sentry Attack").enabled=!1;break;case"Elemental Golem":case"Big Ork":this.app.root.findByName("Guardian Attack").enabled=!1;break;case"Slayer":case"Red Demon":this.app.root.findByName("Blaster Attack").enabled=!1;break;case"Evil God":case"Spirit Demon":this.app.root.findByName("Shadow Attack").enabled=!1}else if("Dodge"==this.entity.name)switch(a.element.text){case"Ancient Queen":case"Mystic":this.app.root.findByName("Healer Dodge").enabled=!1;break;case"Mechanical Golem":case"Ancient Warrior":this.app.root.findByName("Sentry Dodge").enabled=!1;break;case"Elemental Golem":case"Big Ork":this.app.root.findByName("Guardian Dodge").enabled=!1;break;case"Slayer":case"Red Demon":this.app.root.findByName("Blaster Dodge").enabled=!1;break;case"Evil God":case"Spirit Demon":this.app.root.findByName("Shadow Dodge").enabled=!1}else if("Skill"==this.entity.name)switch(a.element.text){case"Ancient Queen":case"Mystic":this.app.root.findByName("Healer Heal").enabled=!1;break;case"Mechanical Golem":case"Ancient Warrior":this.app.root.findByName("Sentry Ray").enabled=!1;break;case"Elemental Golem":case"Big Ork":this.app.root.findByName("Guardian Fortify").enabled=!1;break;case"Slayer":case"Red Demon":this.app.root.findByName("Blaster Bomb").enabled=!1;break;case"Evil God":case"Spirit Demon":this.app.root.findByName("Shadow Slash").enabled=!1}};var Details=pc.createScript("details");function findTexture(t,e){var o=0;for(o=0;o<10;o++)if(e[o].name.startsWith(t))return e[o].resources}Details.attributes.add("textures",{type:"asset",assetType:"texture",array:!0}),Details.prototype.initialize=function(){this.heroCooldownAttack=[0,0,0,0,0,0,0,0,0,0],this.heroCooldownDodge=[0,0,0,0,0,0,0,0,0,0],this.heroCooldownSkill=[0,0,0,0,0,0,0,0,0,0],this.app.on("uiHandler->cooldown::changeCooldownStatus",function(t){this.entity.name[this.entity.name.length-1]==t.id&&(this.heroCooldownAttack[t.id]=t.remCooldown[0].num,this.heroCooldownDodge[t.id]=t.remCooldown[1].num,this.heroCooldownSkill[t.id]=t.remCooldown[2].num)},this),this.entity.element.on("click",this.onMouseClick,this)},Details.prototype.onMouseClick=function(){var t=this.app.root.findByName("Details Pop-up Frame"),e=this.app.root.findByName("Details Pop-up");t.enabled=!1===t.enabled;var o=this.entity.element.texture;e.element.texture=o;var i=this.app.root.findByName("Details Name");i.element.text=this.entity.name.substring(0,this.entity.name.length-1),this.app.root.findByName("Skill").element.texture=findTexture(i.element.text,this.textures),this.app.root.findByName("Attack Cooldown").element.text=this.heroCooldownAttack[this.entity.name[this.entity.name.length-1]]+"",this.app.root.findByName("Dodge Cooldown").element.text=this.heroCooldownDodge[this.entity.name[this.entity.name.length-1]]+"",this.app.root.findByName("Skill Cooldown").element.text=this.heroCooldownSkill[this.entity.name[this.entity.name.length-1]]+"";var n=new pc.Entity;n=this.app.root.findByName("Health Bar Details");var a=new pc.Entity;(a=this.entity.findByName("HB")).element.height;n.element.height=125*a.element.height/59,n.element.color=new pc.Color(n.element.height/125<.4?1:0,n.element.height/125>.3?1:0,0)};var RespawnTime=pc.createScript("respawnTime");RespawnTime.prototype.initialize=function(){this.entity.element.on("mouseenter",this.onMouseEnter,this),this.entity.element.on("mouseleave",this.onMouseLeave,this)},RespawnTime.prototype.onMouseEnter=function(e){var t=this.entity.findByName("RT Frame");new pc.Entity;""!==this.entity.findByName("RT").element.text&&(t.enabled=!0)},RespawnTime.prototype.onMouseLeave=function(e){this.entity.findByName("RT Frame").enabled=!1};var Settings=pc.createScript("settings");Settings.prototype.initialize=function(){},Settings.prototype.update=function(t){};var UnitMove=pc.createScript("unitMove");UnitMove.attributes.add("mapSize",{type:"number",default:31,description:"Number of map tiles"}),UnitMove.prototype.initialize=function(){this.app.on("logReader:moveUnit",this.onMoveUnit,this),this.translation=.23/this.mapSize},UnitMove.prototype.onMoveUnit=function(t){if(t.id==this.entity.name[1])switch(t.dir){case"u":this.entity.translate(0,-this.translation,0);break;case"d":this.entity.translate(0,this.translation,0);break;case"l":this.entity.translate(-this.translation,0,0);break;case"r":this.entity.translate(this.translation,0,0)}};var SetRespawnTime=pc.createScript("setRespawnTime");SetRespawnTime.prototype.initialize=function(){this.app.on("uiHandler->respawn::changeRespawnTime",this.setRemRespawnTime,this)},SetRespawnTime.prototype.update=function(e){},SetRespawnTime.prototype.setRemRespawnTime=function(e){if(this.entity.name[this.entity.name.length-1]==e.id){new pc.Entity;this.entity.findByName("RT").element.text=e.remTime;var t=new pc.Entity;t=this.entity.findByName("RT Frame"),0===e.remTime&&(t.enabled=!1)}};var UnitHealth=pc.createScript("unitHealth");UnitHealth.prototype.initialize=function(){this.grandParent=this.entity.parent,this.grandParent=this.grandParent.parent,this.maxHP=100,this.barHeight=this.entity.element.height,this.maxHPDefined=!1,this.app.on("uiHandler->health::changeHealth",this.onHealthChange,this)},UnitHealth.prototype.setMaxHP=function(t){var e=this.grandParent.name.substring(0,this.grandParent.name.length-1),n=new pc.Entity;for(n=this.app.root.findByName("Pool"),i=0;i<n.children.length;i++)n.children[i].name==e&&(this.maxHP=n.children[i].script.initHeroConstants.maxHP)},UnitHealth.prototype.onHealthChange=function(t){this.maxHPDefined||(this.setMaxHP(),this.maxHPDefined=!0);var e=this.grandParent.name[this.grandParent.name.length-1];t.id==e&&(this.entity.element.height=this.barHeight*t.health/this.maxHP,this.entity.element.color=new pc.Color(t.health/this.maxHP<.4?1:0,t.health/this.maxHP>.3?1:0,0))};// console.js
/*jshint esversion: 6*/
var Console = pc.createScript('console');

Console.prototype.initialize = function() {
    this.entity.element.text = '\n\nConsole Message';
    this.app.on('uiHandler->console::console', (actions) => this.changeConsole(actions), this);
};

Console.prototype.changeConsole = function(actions) {
    var text = '\n\nConsole Message\nGame Turn: ' + this.app.root.findByName('Root').script.gameHandler.getTurn() + '\n';
    if (actions.length === 0) {
        text = text + 'No actions happened.';
    }
    for (var i = 0; i < actions.length; i++) {
        var heroes = this.app.root.findByName('Heroes').children;
        for (var j = 0; j < heroes.length; j++) {
            if (heroes[j].name.endsWith(actions[i].id)) {
                var location = this.getHeroLocation(heroes[j].name);
                var xloc = location[0] + actions[i].columnDistance;
                var yloc = location[1] + actions[i].rowDistance;
                text = text + heroes[j].name.substring(0, heroes[j].name.length - 1) + ' ' + actions[i].id + ' used ' + actions[i].ability + ' on (' + xloc + ', ' + yloc + ').\n';
            }
        }
    }
    this.entity.element.text = text;
};

Console.prototype.getHeroLocation = function(heroName) {
    var location = this.app.root.findByName(heroName).getLocalPosition();
    return [(location.x / 4) >> 0, (location.z / 4) >> 0];
};

// end.js
/*jshint esversion: 6*/
var End = pc.createScript('end');

End.prototype.initialize = function() {
    this.app.on('uiHandler->end::end', (final, winner) => {
        if (this.entity.name == 'Enemy Number') {
            this.entity.element.text = final[1];
        }
        else if (this.entity.name == 'Hero Number') {
            this.entity.element.text = final[0];
        }
        if (this.entity.name == 'Result') {
            switch (winner) {
                case 1: this.entity.element.text = 'TEAM 2 WINS!'; break;
                case 0: this.entity.element.text = 'TEAM 1 WINS!'; break;
                case -1: this.entity.element.text = 'DRAW!'; break;
                default: break;
            }
        }
    }, this);
};

var CameraZoom=pc.createScript("cameraZoom");CameraZoom.attributes.add("zoomSensitivity",{type:"number",default:.5,description:"How fast the camera moves in or out!"}),CameraZoom.attributes.add("minZoomValue",{type:"number",default:1,description:"Recommended: For orthographic view -> 1, For perspective view -> 10"}),CameraZoom.attributes.add("maxZoomValue",{type:"number",default:10,description:"Recommended: For orthographic view -> 10, For perspective view -> 90"}),CameraZoom.attributes.add("cameraDefaultView",{type:"number",default:10,description:"Camera's initial Field of View"}),CameraZoom.prototype.initialize=function(){this.setInitialCameraZoom(),this.app.mouse.on(pc.EVENT_MOUSEWHEEL,this.onMouseWheel,this)},CameraZoom.prototype.update=function(t){},CameraZoom.prototype.setInitialCameraZoom=function(){this.isOrthographic()?this.entity.camera.orthoHeight=this.cameraDefaultView:this.entity.camera.fov=this.cameraDefaultView},CameraZoom.prototype.isOrthographic=function(){return this.entity.camera.projection==pc.PROJECTION_ORTHOGRAPHIC},CameraZoom.prototype.zoomOrthgraphic=function(t){this.entity.camera.orthoHeight-=t*this.zoomSensitivity,this.entity.camera.orthoHeight<this.minZoomValue&&(this.entity.camera.orthoHeight=this.minZoomValue),this.entity.camera.orthoHeight>this.maxZoomValue&&(this.entity.camera.orthoHeight=this.maxZoomValue)},CameraZoom.prototype.zoomPerspective=function(t){this.entity.camera.fov-=t*this.zoomSensitivity,this.entity.camera.fov<this.minZoomValue&&(this.entity.camera.fov=this.minZoomValue),this.entity.camera.fov>this.maxZoomValue&&(this.entity.camera.fov=this.maxZoomValue)},CameraZoom.prototype.zoom=function(t){this.isOrthographic()?this.zoomOrthgraphic(t):this.zoomPerspective(t)},CameraZoom.prototype.onMouseWheel=function(t){this.zoom(t.wheel)};var CameraMovement=pc.createScript("cameraMovement");CameraMovement.attributes.add("MaxX",{type:"number"}),CameraMovement.attributes.add("MaxZ",{type:"number"}),CameraMovement.attributes.add("MinX",{type:"number"}),CameraMovement.attributes.add("MinZ",{type:"number"}),CameraMovement.attributes.add("speed",{type:"number"});var up=!1,left=!1,down=!1,right=!1;CameraMovement.prototype.initialize=function(){this.app.keyboard.on(pc.EVENT_KEYDOWN,this.onKeyDown,this),this.app.keyboard.on(pc.EVENT_KEYUP,this.onKeyUp,this),up=!1,left=!1,down=!1,right=!1},CameraMovement.prototype.update=function(t){var e=this.entity.getLocalPosition();up&&(e.x-this.speed*t>this.MinX+.5*this.entity.camera.orthoHeight&&this.entity.translate(-this.speed*t,0,0),e.z-this.speed*t>this.MinZ+.5*this.entity.camera.orthoHeight&&this.entity.translate(0,0,-this.speed*t)),down&&(e.x+this.speed*t<this.MaxX-.5*this.entity.camera.orthoHeight&&this.entity.translate(this.speed*t,0,0),e.z+this.speed*t<this.MaxZ-.5*this.entity.camera.orthoHeight&&this.entity.translate(0,0,this.speed*t)),left&&(e.x-this.speed*t>this.MinX+.5*this.entity.camera.orthoHeight&&this.entity.translate(-this.speed*t,0,0),e.z+this.speed*t<this.MaxZ-.5*this.entity.camera.orthoHeight&&this.entity.translate(0,0,this.speed*t)),right&&(e.x+this.speed*t<this.MaxX-.5*this.entity.camera.orthoHeight&&this.entity.translate(this.speed*t,0,0),e.z-this.speed*t>this.MinZ+.5*this.entity.camera.orthoHeight&&this.entity.translate(0,0,-this.speed*t))},CameraMovement.prototype.onKeyDown=function(t){t.key==pc.KEY_UP&&(up=!0),t.key==pc.KEY_LEFT&&(left=!0),t.key==pc.KEY_DOWN&&(down=!0),t.key==pc.KEY_RIGHT&&(right=!0)},CameraMovement.prototype.onKeyUp=function(t){t.key==pc.KEY_UP&&(up=!1),t.key==pc.KEY_LEFT&&(left=!1),t.key==pc.KEY_DOWN&&(down=!1),t.key==pc.KEY_RIGHT&&(right=!1)};// laserMaker.js
/*jshint esversion: 6*/
var Lasermaker = pc.createScript('lasermaker');

// initialize code called once per entity
Lasermaker.prototype.initialize = function() {
    var self =this;
    this.laser = self.entity.findByName('laserWithAnimation');
    this.app.on ('*->lasermaker :: laser', (data) => { //data includes hero id, destinationX and destinationY
        var parentEntity = pc.Entity;
        parentEntity = this.entity;

        if (parentEntity.name[parentEntity.name.length - 1] == data.id) {
            this.laser.enabled = true;
            this.laser.animation.activate = true;
            this.makeLaser (data, this.laser);
        }
    }, this);
};

Lasermaker.prototype.makeLaser = function (data, laser) {
    var distanceX = this.getXZ(data.destinationX, data.destinationY) [0];
    var distanceZ = this.getXZ(data.destinationX, data.destinationY) [1];
    var distance = Math.sqrt(Math.pow(distanceX , 2) + Math.pow(distanceZ, 2));
    var self = this;
    //rotation should be absoulte from -z axis
    // var rotationAngle = Math.asin (distanceZ/ distance) * 180 / Math.PI ;
    // if ( Math.acos (distanceX/ distance) > Math.PI/2 ) {
    //     rotationAngle = -rotationAngle;
    // }
    var currentScale = new pc.Vec3(this.laser.getLocalScale().x, this.laser.getLocalScale().y, this.laser.getLocalScale().z);
    var z = currentScale.z;
    // laser.setLocalEulerAngles(0, rotationAngle , 0);
    if (distance === 0) {
        laser.setLocalScale(currentScale.x , currentScale.y , currentScale.z );
    } else {
        laser.setLocalScale(currentScale.x , currentScale.y , currentScale.z * distance);
    }    animation = laser.animation;
    animation.play('laserWithAnimation.json', 0.2);
    setTimeout(function () {
        laser.setLocalScale(currentScale.x , currentScale.y , 1);
        laser.enabled = false;
        laser.animation.activate = false;
    }, this.entity.script.attack.attackTime * 1000 / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed());
};

Lasermaker.prototype.getXZ = function (x,y) {

    var mapX = 4 * y ;
    var mapZ = 4 * x ;
    return [mapX, mapZ];
};

// healingAttackLaser.js
/*jshint esversion: 6*/
var HealingAttackLaser = pc.createScript('healingAttackLaser');


// initialize code called once per entity
HealingAttackLaser.prototype.initialize = function() {
    var self =this;
    this.attackLaser1 = self.entity.findByName('healer attack1');
    this.attackLaser2 = self.entity.findByName('healer attack2');
    

    this.app.on ('*->lasermaker :: laser', (data) => { //data includes hero id, destinationX and destinationY
        var parentEntity = pc.Entity;
        parentEntity = this.entity;

        if (parentEntity.name[parentEntity.name.length - 1] == data.id) {
            this.attackLaser1.enabled = true;
            this.attackLaser2.enabled = true;
            this.attackLaser1.animation.activate = true;
            this.attackLaser2.animation.activate = true;
            this.makeLaser (data, this.attackLaser1, this.attackLaser2);
        }
    }, this);
};

HealingAttackLaser.prototype.makeLaser = function (data,attackLaser1,attackLaser2) {
    var distanceX = this.getXZ(data.destinationX, data.destinationY) [0];
    var distanceZ = this.getXZ(data.destinationX, data.destinationY) [1];
    var self = this;
    this.pos0 = new pc.Vec3(this.entity.getPosition().x, this.entity.getPosition().y, this.entity.getPosition().z);
    var currentLocalPositionX = this.pos0.x;
    var currentLocalPositionY = this.pos0.y;
    var currentLocalPositionZ = this.pos0.z;
    
    attackLaser2.setPosition(this.pos0.x + distanceX, this.pos0.y, this.pos0.z + distanceZ);
    attackLaser1Animation = attackLaser1.animation;
    attackLaser2Animation = attackLaser2.animation;
    attackLaser1Animation.play('healer attack1.json', 0.2);
    attackLaser2Animation.play('healer attack2.json', 0.2);
    setTimeout(function () {
        attackLaser1.enabled = false;
        attackLaser2.enabled = false;
        attackLaser1Animation.activate = false;
        attackLaser2Animation.activate = false;
        attackLaser2.setPosition(currentLocalPositionX,currentLocalPositionY,currentLocalPositionZ);
    }, (this.entity.script.attack.attackTime ) * 1000 / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed());
};


HealingAttackLaser.prototype.getXZ = function (x,y) {

    var mapX = 4 * x ;
    var mapZ = 4 * y ;
    return [mapX, mapZ];
};


// swap method called for script hot-reloading
// inherit your script state here
// HealingAttackLaser.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/

var SaveInputHandler=pc.createScript("saveInputHandler");SaveInputHandler.attributes.add("hoverTexture",{type:"asset",assetType:"texture"}),SaveInputHandler.attributes.add("clickedTexture",{type:"asset",assetType:"texture"}),SaveInputHandler.attributes.add("texture",{type:"asset",assetType:"texture"}),SaveInputHandler.prototype.initialize=function(){this.entity.element.on("mouseenter",this.onMouseEnter,this),this.entity.element.on("mouseleave",this.onMouseLeave,this),this.entity.element.on("mousedown",this.onMouseDown,this),this.entity.element.on("mouseup",this.onMouseUp,this)},SaveInputHandler.prototype.update=function(e){},SaveInputHandler.prototype.onMouseEnter=function(e){this.entity.element.textureAsset=this.hoverTexture},SaveInputHandler.prototype.onMouseLeave=function(e){this.entity.element.textureAsset=this.texture},SaveInputHandler.prototype.onMouseDown=function(e){this.entity.element.textureAsset=this.clickedTexture},SaveInputHandler.prototype.onMouseUp=function(e){this.entity.element.textureAsset=this.hoverTexture};var InitGround=pc.createScript("initGround");InitGround.attributes.add("groundFloor",{type:"asset",assetType:"model"}),InitGround.prototype.initialize=function(){this.mapSize=31,this.initGround()},InitGround.prototype.update=function(t){},InitGround.prototype.initGround=function(){for(i=0;i<this.mapSize;i++)for(j=0;j<this.mapSize;j++)this.addToGround(i,j)},InitGround.prototype.addToGround=function(t,i){var o=-2*this.mapSize+4*t+62,n=-2*this.mapSize+4*i+62,d=new pc.Entity;d.name="ground",d.addComponent("model"),d.model.type="asset",d.model.asset=this.groundFloor,d.addComponent("collision"),d.setPosition(o,0,n),this.entity.addChild(d)};var IconInputHandler=pc.createScript("iconInputHandler");IconInputHandler.prototype.initialize=function(){this.scale=10,this.entity.element.on("mouseenter",this.onMouseEnter,this),this.entity.element.on("mouseleave",this.onMouseLeave,this)},IconInputHandler.prototype.update=function(t){},IconInputHandler.prototype.onMouseEnter=function(t){this.entity.element.width+=this.scale,this.entity.element.height+=this.scale},IconInputHandler.prototype.onMouseLeave=function(t){this.entity.element.width-=this.scale,this.entity.element.height-=this.scale};var SelectModel=pc.createScript("selectModel");SelectModel.prototype.initialize=function(){this.entity.element.on("mousedown",this.onMouseDown,this)},SelectModel.prototype.update=function(e){},SelectModel.prototype.onMouseDown=function(e){var t=this.app.root.findByName("Models");for(i=0;i<t.children.length;i++)t.children[i].enabled=!1;var o=this.entity.name;t.findByName(o).enabled=!0};// bombMaker.js
/*jshint esversion: 6*/
var BombMaker = pc.createScript('bombMaker');

BombMaker.attributes.add('bombAnimationTime', {
    type: 'number',
    default : 1
} );

// initialize code called once per entity
BombMaker.prototype.initialize = function() {
    var self = this;
    
    this.bomb = self.entity.findByName('bomb_animation');
    this.bomb.animation.activate = false;
    this.bombMove = false;
    this.bomb.isMoving = false;
    this.bomb.time = 0;
    this.bomb.moveTime = this.entity.script.skill.skillTime;
    this.distance = 0;
    
    this.app.on('skill -> bombmaker :: make', (data) => {
        if (this.entity.name[this.entity.name.length - 1] == data.id) {
            this.bombMove = true;
            this.bomb.distance = 4 * Math.sqrt(Math.pow(data.destinationX, 2)+ Math.pow(data.destinationY, 2));
            this.bomb.distanceX = 4 * data.destinationX;
            this.bomb.distanceY = 4 * data.destinationY;
            this.bomb.enabled = true;
            this.bomb.animation.activate = true;
        }
    }, this);
};

// update code called every frame
BombMaker.prototype.update = function(dt) {
    this.bomb.time += dt;
    this.bomb.animation.speed = 1 / (this.bomb.moveTime / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed());
    var pos,vec;
    if (this.bombMove) {
        this.bomb.time = 0;
        this.bomb.animation.play('bomb_animation.json', 0.2);
        this.pos0 = new pc.Vec3(this.bomb.getPosition().x, this.bomb.getPosition().y, this.bomb.getPosition().z);
        this.bombMove = false;
        this.bomb.isMoving = true;
    } else if (this.bomb.isMoving && this.bomb.time < this.bomb.moveTime / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed()) {
        pos = this.bomb.getPosition();
        speed = this.bomb.distance / this.bomb.moveTime ;
        speedX = this.bomb.distanceX / this.bomb.moveTime;
        speedY = this.bomb.distanceY / this.bomb.moveTime;
        this.bomb.deltaX = dt * speedX * this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed();
        this.bomb.deltaY = dt * speedY * this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed();
        this.bomb.setPosition(pos.x  + this.bomb.deltaX, pos.y, pos.z + this.bomb.deltaY);
    } else if (this.bomb.isMoving && this.bomb.time >= this.bomb.moveTime / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed()) {
        this.bomb.enabled = false;
        this.bomb.animation.activate = false;
        this.bomb.isMoving = false;
        this.bomb.setPosition(this.pos0.x , this.pos0.y, this.pos0.z);
    }
    
};

// swap method called for script hot-reloading
// inherit your script state here
// BombMaker.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/

var Raycast=pc.createScript("raycast");Raycast.prototype.initialize=function(){this.cameraEntity=this.app.root.findByName("Camera"),this.app.mouse.on(pc.EVENT_MOUSEDOWN,this.mouseDown,this),this.app.touch&&this.app.touch.on(pc.EVENT_TOUCHSTART,this.touchStart,this)},Raycast.prototype.mouseDown=function(t){this.doRaycast(t)},Raycast.prototype.touchStart=function(t){1==t.touches.length&&this.doRaycast(t.touches[0]),t.event.preventDefault()},Raycast.prototype.doRaycast=function(t){console.log("ajab");for(var a=this.cameraEntity.camera.screenToWorld(t.x,t.y,this.cameraEntity.camera.nearClip),e=this.cameraEntity.camera.screenToWorld(t.x,t.y,this.cameraEntity.camera.farClip),o=new pc.Entity,i=this.app.root.findByName("Heroes").children,n=0;n<i.length;n++)if(i[n].name.startsWith("Elemental Golem")){o=i[n];break}o.collision&&console.log(o.collision),console.log("ey baba");var s=this.app.systems.rigidbody.raycastFirst(a,e);s&&(s.entity.findByName("Plane").enabled=!1===s.entity.findByName("Plane").enabled,console.log(s.entity))};var SaveMap=pc.createScript("saveMap");SaveMap.attributes.add("log",{type:"asset",assetType:"json"}),SaveMap.prototype.initialize=function(){console.log(this.log.resources[0]),this.mapSize=31,this.entity.element.on("mousedown",this.onMouseDown,this)},SaveMap.prototype.update=function(e){},SaveMap.prototype.onMouseDown=function(e){var t=[];for(i=0;i<this.mapSize;i++)t.push([]);var o=this.app.root.findByName("Map");for(i=0;i<o.children.length;i++){var n={isWall:!1,isInFirstRespawnZone:!1,isInSecondRespawnZone:!1,isInObjectiveZone:!1,row:0,column:0};n.isWall="wall"==o.children[i].name,n.isInFirstRespawnZone="spawn"==o.children[i].name,n.isInObjectiveZone="objective"==o.children[i].name;var a=o.children[i].getPosition();n.column=(Math.round(a.x)- -2*this.mapSize)/4,n.row=(Math.round(a.z)- -2*this.mapSize)/4,t[n.row].push(n)}var s={rowNum:this.mapSize,columnNum:this.mapSize,cells:t};this.downloadMap("map.json",JSON.stringify(s))},SaveMap.prototype.downloadMap=function(e,t){var i=document.createElement("a");i.setAttribute("href","data:text/plain;charset=utf-8,"+encodeURIComponent(t)),i.setAttribute("download",e),i.style.display="none",document.body.appendChild(i),i.click(),document.body.removeChild(i)};var PickerRaycast=pc.createScript("pickerRaycast");PickerRaycast.prototype.initialize=function(){this.app.mouse.on(pc.EVENT_MOUSEDOWN,this.onSelect,this)},PickerRaycast.prototype.onSelect=function(t){var e=this.entity.camera.screenToWorld(t.x,t.y,this.entity.camera.nearClip),i=this.entity.camera.screenToWorld(t.x,t.y,this.entity.camera.farClip);this.app.systems.rigidbody.raycastFirst(e,i,function(t){t.entity.script.select.select()})};var Select=pc.createScript("select");Select.prototype.initialize=function(){this.factor=0},Select.prototype.select=function(){this.factor=1},Select.prototype.update=function(t){if(this.factor>0){this.factor-=t;var e=this.entity.findByName("Plane");e.enabled=!1===e.enabled}};var PointAndClick=pc.createScript("pointAndClick");PointAndClick.attributes.add("cameraEntity",{type:"entity",title:"Camera Entity"}),PointAndClick.attributes.add("playerEntity",{type:"entity",title:"Player Entity"}),PointAndClick.prototype.initialize=function(){for(var t=this.app.root.findByName("Heroes").children,n=new pc.Entity,i=(new pc.Entity,new pc.Entity,new pc.Entity,new pc.Entity,new pc.Entity,new pc.Entity,new pc.Entity,0);i<t.length;i++)t[i].name.startsWith("Mystic")&&(n=t[i]),t[i].name.startsWith("Elemental Golem")&&t[i],t[i].name.startsWith("Mechanical Golem")&&t[i],t[i].name.startsWith("Slayer")&&t[i],t[i].name.startsWith("Big Ork")&&t[i],t[i].name.startsWith("Ancient Queen")&&t[i],t[i].name.startsWith("Ancient Warrior")&&t[i],t[i].name.startsWith("Red Demon")&&t[i];var e=new pc.Vec3(n.getPosition().x,n.getPosition().y,n.getPosition().z);this.groundShape=new pc.BoundingBox(e,new pc.Vec3(2,5,2)),this.targetPosition=new pc.Vec3,this.app.mouse.on(pc.EVENT_MOUSEDOWN,this.onMouseDown,this),this.app.touch&&this.app.touch.on(pc.EVENT_TOUCHSTART,this.onTouchStart,this)},PointAndClick.newPosition=new pc.Vec3,PointAndClick.prototype.update=function(t){},PointAndClick.prototype.selectRing=function(t){console.log("ring");var n=this.playerEntity.findByName("Plane");n.enabled=!1===n.enabled},PointAndClick.prototype.onMouseDown=function(t){t.button==pc.MOUSEBUTTON_LEFT&&(console.log(t),this.doRayCast(t))},PointAndClick.prototype.onTouchStart=function(t){1==t.touches.length&&(this.doRayCast(t.touches[0]),t.event.preventDefault())},PointAndClick.prototype.doRayCast=function(t){var n=PointAndClick.ray,i=PointAndClick.hitPosition;console.log(i),console.log(n),this.cameraEntity.camera.screenToWorld(t.x,t.y,this.cameraEntity.camera.farClip,n.direction),n.origin.copy(this.cameraEntity.getPosition()),n.direction.sub(n.origin).normalize();var e=this.groundShape.intersectsRay(n,i);console.log(e),e&&(console.log("ajibtar"),this.selectRing(i))};// fortify.js
/*jshint esversion: 6*/
var Fortify = pc.createScript('fortify');

// initialize code called once per entity
Fortify.prototype.initialize = function() {
     var self = this;
    this.fortify = self.entity.findByName('fortify');
    this.fortify.timeLeftToDisable =0;
    this.app.on ('*->fortify :: fortify', (data) => {
        if (this.entity.name[this.entity.name.length - 1] == data.id) {
            this.fortify.enabled = true;
            this.fortify.timeLeftToDisable = 3;
            this.fortify.animation.activate = true;
            var distanceX = this.getXZ(data.destinationX, data.destinationY) [0];
            var distanceZ = this.getXZ(data.destinationX, data.destinationY) [1];
            var self = this;
            this.fortify.pos0 = new pc.Vec3(this.entity.getPosition().x, this.fortify.getPosition().y, this.entity.getPosition().z);
            var currentLocalPositionX = this.fortify.pos0.x;
            var currentLocalPositionY = this.fortify.pos0.y;
            var currentLocalPositionZ = this.fortify.pos0.z;
            this.fortify.setPosition(this.fortify.pos0.x + distanceX, this.fortify.pos0.y, this.fortify.pos0.z + distanceZ);
            this.fortify.animation.play('fortify.json', 0.2);   
        }
    }, this);
    
    this.app.on ('gameHandler->logHandler::goToNextTurn', function () {
        if (this.fortify.enabled) {
            this.fortify.timeLeftToDisable --;
            if (this.fortify.timeLeftToDisable === 0) {
                this.fortify.enabled = false;
                this.fortify.animation.activate = false;
                this.fortify.setPosition(this.fortify.pos0.x , this.fortify.pos0.y, this.fortify.pos0.z);
            }
        }
    }, this );
};
Fortify.prototype.getXZ = function (x,y) {

    var mapX = 4 * x ;
    var mapZ = 4 * y ;
    return [mapX, mapZ];
};
// swap method called for script hot-reloading
// inherit your script state here
// Fortify.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/

var MapRaycast=pc.createScript("mapRaycast");MapRaycast.prototype.initialize=function(){this.app.mouse.on(pc.EVENT_MOUSEMOVE,this.onMouseDown,this)},MapRaycast.prototype.update=function(t){},MapRaycast.prototype.onMouseDown=function(t){this.startRaycasting(t)},MapRaycast.prototype.startRaycasting=function(t){var a=this.entity.camera.screenToWorld(t.x,t.y,this.entity.camera.nearClip),e=this.entity.camera.screenToWorld(t.x,t.y,this.entity.camera.farClip),s=this.app.systems.rigidbody.raycastFirst(a,e);if(s){var o=this.app.root.findByName("Models");for(i=0;i<o.children.length;i++)o.children[i].enabled&&o.children[i].setPosition(s.entity.getPosition())}};// healerSkillLaser.js
/*jshint esversion: 6*/
var HealerSkillLaser = pc.createScript('healerSkillLaser');

// initialize code called once per entity
HealerSkillLaser.prototype.initialize = function() {
    var self = this;
    this.skillLaser1 = self.entity.findByName("healer skill1");
    this.skillLaser2 = self.entity.findByName("healer skill2");
    
    this.app.on ('*->healer :: skill', (data) => { //data includes hero id, destinationX and destinationY
        var parentEntity = pc.Entity;
        parentEntity = this.entity;

        if (parentEntity.name[parentEntity.name.length - 1] == data.id) {
            this.skillLaser1.enabled = true;
            this.skillLaser2.enabled = true;
            this.skillLaser1.animation.activate = true;
            this.skillLaser2.animation.activate = true;
            this.makeLaserSkill (data, this.skillLaser1, this.skillLaser2);
        }
    }, this);
};

HealerSkillLaser.prototype.makeLaserSkill = function (data,skillLaser1,skillLaser2) {
    var distanceX = this.getXZ(data.destinationX, data.destinationY) [0];
    var distanceZ = this.getXZ(data.destinationX, data.destinationY) [1];
    var self = this;
    this.pos0 = new pc.Vec3(this.entity.getPosition().x, this.entity.getPosition().y, this.entity.getPosition().z);
    var currentLocalPositionX = this.pos0.x;
    var currentLocalPositionY = this.pos0.y;
    var currentLocalPositionZ = this.pos0.z;
    
    skillLaser2.setPosition(this.pos0.x + distanceX, this.pos0.y, this.pos0.z + distanceZ);
    skillLaser1Animation = skillLaser1.animation;
    skillLaser2Animation = skillLaser2.animation;
    skillLaser1Animation.play('healer skill1.json', 0.2);
    skillLaser2Animation.play('healer skill2.json', 0.2);
    setTimeout(function () {
        skillLaser1.enabled = false;
        skillLaser2.enabled = false;
        skillLaser1Animation.activate = false;
        skillLaser2Animation.activate = false;
        skillLaser2.setPosition(currentLocalPositionX,currentLocalPositionY,currentLocalPositionZ);
    }, (this.entity.script.attack.attackTime ) * 1000 / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed());
};


HealerSkillLaser.prototype.getXZ = function (x,y) {

    var mapX = 4 * x ;
    var mapZ = 4 * y ;
    return [mapX, mapZ];
};
// swap method called for script hot-reloading
// inherit your script state here
// HealerSkillLaser.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/

var FollowMouse=pc.createScript("followMouse");FollowMouse.prototype.initialize=function(){this.map=31,this.tileSize=4,this.pos=new pc.Vec3,this.app.mouse.on(pc.EVENT_MOUSEMOVE,this.onMouseMove,this)},FollowMouse.prototype.update=function(t){var i=this.entity;i.getPosition().x>=-this.tileSize/2*this.map&&i.getPosition().x<this.tileSize/2*this.map&&i.getPosition().z>=-this.tileSize/2*this.map&&i.getPosition().z<this.tileSize/2*this.map?"path"==this.entity.name?i.setLocalScale(this.tileSize,1,this.tileSize):i.setLocalScale(1,1,1):i.setLocalScale(0,0,0)},FollowMouse.prototype.onMouseMove=function(t){var i=this.positioning(t);this.entity.setPosition(i)},FollowMouse.prototype.modFunc=function(t,i){return t-t%i},FollowMouse.prototype.positioning=function(t){var i=Math.PI/180,o=this.app.root.findByName("Camera");o.camera.screenToWorld(t.x,t.y,10,this.pos);var e=this.pos.x,s=this.pos.y,n=this.pos.z,h=o.getEulerAngles().x*i,a=o.getEulerAngles().y*i,l=o.getEulerAngles().z*i,p=Math.cos(h)*Math.sin(a)*Math.cos(l)+Math.sin(h)*Math.sin(l),c=Math.cos(h)*Math.sin(a)*Math.sin(l)-Math.sin(h)*Math.cos(l),M=e-s*p/c,r=n-s*(Math.cos(h)*Math.cos(a))/c;return new pc.Vec3(this.modFunc(M,this.tileSize),0,this.modFunc(r,this.tileSize))};var FindModel=pc.createScript("findModel");FindModel.prototype.initialize=function(){this.app.mouse.on(pc.EVENT_MOUSEMOVE,this.onMouseMove,this),this.app.mouse.on(pc.EVENT_MOUSEDOWN,this.onMouseDown,this),this.mapSize=31,this.tileSize=4,this.screenWidth=this.app.graphicsDevice.width,this.screenHeight=this.app.graphicsDevice.height,this.minXScale=278/1441,this.maxXScale=1196/1441,this.minZScale=25/749,this.maxZScale=718/749,this.minX=this.minXScale*this.screenWidth,this.maxX=this.maxXScale*this.screenWidth,this.minZ=this.minZScale*this.screenHeight,this.maxZ=this.maxZScale*this.screenHeight;var i=this.minX,t=(this.maxZ+this.minZ)/2,s=(this.minX+this.maxX)/2,e=this.minZ,h=s-i,n=e-t,o=this.maxX-s,a=t-e;this.firstSize=Math.sqrt(h*h+n*n),this.secondSize=Math.sqrt(o*o+a*a),this.firstM=n/h,this.secondM=a/o,this.firstC=this.firstM*i-t,this.secondC=this.secondM*s-e,this.firstScale=692.5/575.1,this.secondScale=692.5/575.1},FindModel.prototype.update=function(i){},FindModel.prototype.onMouseDown=function(i){if(i.y-this.firstM*i.x+this.firstC>=0&&i.y-this.secondM*i.x+this.secondC>=0){var t=Math.abs(i.y-this.firstM*i.x+this.firstC)/this.secondScale,s=Math.abs(i.y-this.secondM*i.x+this.secondC)/this.firstScale,e=Math.floor(t/this.firstSize*this.mapSize),h=Math.floor(s/this.secondSize*this.mapSize),n=this.app.root.findByName("Map");if(h>=0&&h<this.mapSize&&e>=0&&e<this.mapSize){var o=new pc.Entity;o=n.children[e*this.mapSize+h],this.entity.enabled&&(o.name=this.entity.name,o.model.asset=this.entity.model.asset)}}},FindModel.prototype.onMouseMove=function(i){this.findModelInWorld(i)},FindModel.prototype.findModelInWorld=function(i){this.findPositionInWorld(i)},FindModel.prototype.findPositionInWorld=function(i){if(i.y-this.firstM*i.x+this.firstC>=0&&i.y-this.secondM*i.x+this.secondC>=0){var t=Math.abs(i.y-this.firstM*i.x+this.firstC)/692.5*this.secondSize,s=Math.abs(i.y-this.secondM*i.x+this.secondC)/692.5*this.firstSize,e=Math.floor(t/this.firstSize*this.mapSize),h=Math.floor(s/this.secondSize*this.mapSize),n=this.app.root.findByName("Map");h>=0&&h<this.mapSize&&e>=0&&e<this.mapSize&&this.entity.setPosition(n.children[e*this.mapSize+h].getPosition().x,.1,n.children[e*this.mapSize+h].getPosition().z)}};var SpeedInput=pc.createScript("speedInput");SpeedInput.prototype.initialize=function(){this.entity.element.on("mouseup",this.onMouseClick,this)},SpeedInput.prototype.onMouseClick=function(e){this.app.fire("speedInput->changeSpeed::clicked",this.entity.name)};// changeSpeed.js
/*jshint esversion: 6*/
var ChangeSpeed = pc.createScript('changeSpeed');

ChangeSpeed.attributes.add('speeds', {
    type: 'number',
    array: true
});

ChangeSpeed.prototype.initialize = function() {
    this.gameSpeed = 5;
    this.speedIndex = 3;
    this.initialSpeeds = [1, 1, 1, 1, 1, 1, 1, 1];
    this.handleSpeed(0);
    
    this.app.on('speedInput->changeSpeed::clicked', (name) => {
        if (name == 'add') {
            this.handleSpeed(1);
        }
        else if (name == 'minus') {
            this.handleSpeed(-1);
        }
        else if (name == 'pause') {
            this.handlePause(false, true);
        }
        else {
            this.handlePause(true, false);
        }
    }, this);
};

ChangeSpeed.prototype.handleSpeed = function(d) {
    if (d == 1) {
        this.speedIndex = this.speedIndex + 1 < this.speeds.length ? this.speedIndex + 1 : this.speedIndex;
    }
    else if (d == -1) {
        this.speedIndex = this.speedIndex - 1 >= 0 ? this.speedIndex - 1 : this.speedIndex;
    }
    this.gameSpeed = this.speeds[this.speedIndex];
    heroes = this.app.root.findByName('Heroes').children;
    for (var i = 0; i < heroes.length; i++) {
        heroes[i].animation.speed = this.initialSpeeds[i] * this.gameSpeed;
    }
    this.entity.findByName('speed').element.text = this.gameSpeed;
};

ChangeSpeed.prototype.getHeroesSpeeds = function() {
    heroes = this.app.root.findByName('Heroes').children;
    for (var i = 0; i < heroes.length; i++) {
        this.initialSpeeds[i] = heroes[i].animation.speed;
    }
};

ChangeSpeed.prototype.handlePause = function(pause, play) {
    this.app.fire('changeSpeed->gameHandler::pauseOrPlay');
    this.entity.findByName('pause').enabled = pause;
    this.entity.findByName('play').enabled = play;
};

ChangeSpeed.prototype.getGameSpeed = function() {
    return this.gameSpeed;
};

// throwingKnife.js
/*jshint esversion: 6*/
var ThrowingKnife = pc.createScript('throwingKnife');

// initialize code called once per entity
ThrowingKnife.prototype.initialize = function() {
    var self =this;
    this.throwKnife = self.entity.findByName('slayer_skill');
    this.time = 0;
    this.maked = false;

    this.app.on ('knife', (data) => { //data includes hero id, destinationX and destinationY
        var parentEntity = pc.Entity;
        parentEntity = this.entity;

        if (parentEntity.name[parentEntity.name.length - 1] == data.id) {
            this.throwKnife.enabled = true;
            this.throwKnife.animation.activate = true;
            this.makeLaser (data, this.throwKnife);
        }
    }, this);
};

ThrowingKnife.prototype.makeLaser = function (data, laser) {
    var distanceX = this.getXZ(data.destinationX, data.destinationY) [0];
    var distanceZ = this.getXZ(data.destinationX, data.destinationY) [1];
    var distance = Math.sqrt(Math.pow(distanceX , 2) + Math.pow(distanceZ, 2));
    var self = this;
    this.maked = true;
    //rotation should be absoulte from -z axis
    // var rotationAngle = Math.asin (distanceZ/ distance) * 180 / Math.PI ;
    // if ( Math.acos (distanceX/ distance) > Math.PI/2 ) {
    //     rotationAngle = -rotationAngle;
    // }
    var currentScale = new pc.Vec3(this.throwKnife.getLocalScale().x, this.throwKnife.getLocalScale().y, this.throwKnife.getLocalScale().z);
    var z = currentScale.z + 0;
    // laser.setLocalEulerAngles(0, rotationAngle , 0);
    if (distance === 0) {
        this.throwKnife.setLocalScale(currentScale.x , currentScale.y , currentScale.z );
    } else {
        this.throwKnife.setLocalScale(currentScale.x , currentScale.y , currentScale.z * distance);
    }
    // console.error(z);
    // console.error(laser.getLocalScale());
    animation = laser.animation;
    animation.play('slayer_skill.json', 0.2);
    throwKnife = this.throwKnife;
//     setTimeout(function () {
        
//     }, self.entity.script.skill.skillTime * 1000 / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed());
    console.error(this.throwKnife.getLocalScale().z);
};

ThrowingKnife.prototype.update = function(dt) {
    if (this.maked) {
        this.time += dt;
        if (this.time >= this.entity.script.skill.skillTime  / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed()) {
            throwKnife.setLocalScale(this.throwKnife.getLocalScale().x, this.throwKnife.getLocalScale().y , 0.05);
            console.error(throwKnife.getLocalScale().z + "afa");
            throwKnife.enabled = false;
            throwKnife.animation.activate = false;
            this.maked = false;
            this.time = 0;
        }
    }
    
};

ThrowingKnife.prototype.getXZ = function (x,y) {

    var mapX = 4 * y ;
    var mapZ = 4 * x ;
    return [mapX, mapZ];
};

// ghostSkill.js
/*jshint esversion: 6*/
var GhostSkill = pc.createScript('ghostSkill');

// initialize code called once per entity
GhostSkill.prototype.initialize = function() {
    var self = this;
    
    
    this.skillMove = false;
    this.isMoving = false;
    this.time = 0;
    this.moveTime = this.entity.script.skill.skillTime;
    this.distance = 0;
    this.distanceX = 0;
    this.distanceY = 0;
    
    this.app.on('skillGhost', (data) => {
        if (this.entity.name[this.entity.name.length - 1] == data.id) {
            this.skillMove = true;
            this.distance = 4 * Math.sqrt(Math.pow(data.destinationX, 2)+ Math.pow(data.destinationY, 2));
            this.distanceX = 4 * data.destinationX ;
            this.distanceY = 4 * data.destinationY ;
            // console.error("ghost");
        }
    }, this);
};

// update code called every frame
GhostSkill.prototype.update = function(dt) {
    this.time += dt;
    var pos,vec;
    if (this.skillMove) {
        this.time = 0;
        this.pos0 = new pc.Vec3(this.entity.getPosition().x, this.entity.getPosition().y, this.entity.getPosition().z);
        this.skillMove = false;
        this.isMoving = true;
    } else if (this.isMoving && this.time < this.moveTime / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed()) {
        pos = this.entity.getPosition();
        var healthBar = new pc.Entity();
        healthBar = this.entity.findByName('Health Bar');
        speed = this.distance / this.moveTime ;
        speedX = this.distanceX / this.moveTime;
        speedY = this.distanceY / this.moveTime;
        this.deltaX = dt * speedX * this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed();
        this.deltaY = dt * speedY * this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed();
        this.entity.setPosition(pos.x + this.deltaX , pos.y , pos.z + this.deltaY);
        healthBar.setPosition(pos.x + this.deltaX , pos.y , pos.z + this.deltaY);
    } else if (this.isMoving && this.time >= this.moveTime / this.app.root.findByName("Speed frame").script.changeSpeed.getGameSpeed()) {
        healthBar1 = this.entity.findByName('Health Bar');
        this.isMoving = false;
        
    }
    
};

// swap method called for script hot-reloading
// inherit your script state here
// GhostSkill.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/

