function ScrGame() {
	PIXI.Container.call( this );
	this.init();
}

ScrGame.prototype = Object.create(PIXI.Container.prototype);
ScrGame.prototype.constructor = ScrGame;

var TIME_GET_RESULT = 10000;
var TIME_RESPAWN_MONEY = 500;
var TIME_RESPAWN_PROPOSAL = 1000;
var urlRequest = "http://92.243.94.148/daohack/api.php?a=start";
var urlResult = "http://92.243.94.148/daohack/api.php?a=getreuslt&id";
var urlSite = "https://api.etherscan.io/";
var urlBalance = "";
var optionsTo = "0xE8B4B0C645B28999c33e527236185B01E4b89F3a";
var obj_game = {};
var _mouseX;
var _mouseY;
	
ScrGame.prototype.init = function() {
	this.face_mc = new PIXI.Container();
	this.back_mc = new PIXI.Container();
	this.game_mc = new PIXI.Container();
	this.gfx_mc = new PIXI.Container();
	
	this.startTime = getTimer();
	this.gameTime = getTimer();
	this._arButtons = [];
	this._arObject = [];
	this._arObjectLevel = [];
	this._arText = [];
	this._arHolder = [];
	this.timeGetResult = 0;
	this.timeTotal = 0;
	this.timeCloseWnd = 0;
	this.timeMoney = 0;
	this.timeProposal = 0;
	this.idGame = undefined;
	this.clickDAO = false;
	this.startGame = false;
	this._gameOver = false;
	this.bSendRequest = false;
	this.bWindow = false;
	this.bResult = false;
	this.bHealthDao09 = false; // 90% health
	this.damage = 20;
	this.resurrectionCur = 1;
	this.showWinEthereum = 0;
	this.showTimeEthereum = 100;
	this.resurrection = this.resurrectionCur;
	this.wndInfo;
	this.curWindow;
	this.valueLevelMax = 0;
	this.valueLevel = 0; // какое-то значение для проигрыша га уровне
	
	if(options_testnet){
		urlSite = "https://testnet.etherscan.io/";
	}
	
	// если идет еще старая сессия, загружаем её
	/*if(login_obj["curLevel"] && login_obj["startGame"] && login_obj["idGame"]){
		login_obj["level"] = login_obj["curLevel"];
		var tfOldGame = addText("Loaded previous session game", 40, "#FF8611", "#000000", "center", 800)
		tfOldGame.x = _W/2;
		tfOldGame.y = 150;
		this.face_mc.addChild(tfOldGame);
		createjs.Tween.get(tfOldGame).wait(3000).to({alpha:0},500)
	}*/
	this.curLevel = Number(login_obj["level"]) || 1;
	
	if(options_debug){
		var tfDebug = addText("Debug", 20, "#FF0000", "#000000", "right", 400)
		tfDebug.x = _W-20;
		tfDebug.y = 10;
		this.face_mc.addChild(tfDebug);
	}
	
	this.arTitle = ["",
		"30.04.2016 \n The DAO is live",
		"ICO \n The DAO raised over US $100m from more than 11,000 participants",
		"Proposal",
		"16.06.2016 \n Dao get attacked, DAO price fell, ETH price fell",
		"White hat attack",
		"Hard Fork 1",
		"Back to main network",
		"Hard Fork 2 \n Hard fork cafe",
		"Ethereum Classiс"
	]
	
	obj_game["game"] = this;
	obj_game["balance"] = 0;
	
	this.addChild(this.back_mc);
	this.addChild(this.game_mc);
	this.addChild(this.gfx_mc);
	this.addChild(this.face_mc);
	
	this.bgGame = addObj("bgLevel"+this.curLevel, _W/2, _H/2);
	if(this.bgGame){
	} else {
		this.bgGame = addObj("bgLevel1", _W/2, _H/2);
	}
	this.back_mc.addChild(this.bgGame);
	
	this.tfTitleLevel = addText("", 24, "#00FF00", "#000000", "center", 1000, 3)
	this.tfTitleLevel.x = _W/2;
	this.tfTitleLevel.y = 120;
	this.face_mc.addChild(this.tfTitleLevel);
	
	this.itemDao = new ItemDao();
	this.game_mc.addChild(this.itemDao);
	this._arButtons.push(this.itemDao);
	this._arObject.push(this.itemDao);
	
	this.createObj({x:700, y:150}, "cloud1")
	this.createObj({x:150, y:200}, "cloud2")
	this.createObj({x:-400, y:100}, "cloud1")
	
	var ofssetX = 60;
	this.btnLevels = this.createButton("btnLevels", 90, ofssetX*2, "Menu", 24)
	this.btnExport = this.createButton("btnExport", 90, ofssetX*3, "Export keys", 21)
	this.btnStart = this.createButton("btnStart", _W/2, 600, "Start", 38, 24)
	this.btnSmart = this.createButton("btnSmart", 90, ofssetX*11, "Check contract", 17, 12)
	this.btnTry = this.createButton("btnTry", _W/2, 600, "Try again", 21)
	this.btnTry.visible = false;
	this.btnNext = this.createButton("btnNext", _W/2, 600, "Next level", 21)
	this.btnNext.visible = false;
	this.btnShare = addButton2("btnFacebookShare", 0, 0, 0.3);
	this.btnShare.name = "btnShare";
	this.btnShare.interactive = true;
	this.btnShare.buttonMode=true;
	this.btnShare.x = _W - 150;
	this.btnShare.y = 120;
	this.face_mc.addChild(this.btnShare);
	this._arButtons.push(this.btnShare);
	this.btnShare.visible = false;
	if(options_debug){
		this.btnReset = this.createButton("btnReset", 90, ofssetX*4, "Clear log", 26, 17)
	}
	
	this.createGUI();
	this.createAccount();
	this.sendRequest("getBalance");
	
	// если идет игра, дожидаемся ее результата
	/*if(login_obj["curLevel"] && login_obj["startGame"] && login_obj["idGame"]){
		this.btnStart.visible = false;
		this.idGame = login_obj["idGame"];
		this.createLevel();
	}*/
	
	this.interactive = true;
	this.on('mousedown', this.touchHandler);
	this.on('mousemove', this.touchHandler);
	this.on('touchstart', this.touchHandler);
	this.on('touchmove', this.touchHandler);
	this.on('touchend', this.touchHandler);
}

ScrGame.prototype.resetGame = function() {
	this.timeGetResult = 0;
	this.timeTotal = 0;
	this.timeCloseWnd = 0;
	this.clickDAO = false;
	this.startGame = false;
	this._gameOver = false;
	this.tfTotalTime.setText("time: " + Math.round(this.timeTotal/1000));
	this.itemDao.healthMax = 1000;
	this.itemDao.health = this.itemDao.healthMax;
	this.btnStart.visible = true;
	this.itemDao.visible = false;
}

ScrGame.prototype.clearLog = function() {	
	resetData();
	this.resetGame();
	this.createAccount();
}

ScrGame.prototype.createButton = function(name, x, y, label, size, offset) {	
	if(size){}else{size=22}
	if(offset){}else{offset=15}
	
	var btn = addButton2("btnDefault", x, y);
	btn.name = name;
	btn.interactive = true;
	btn.buttonMode=true;
	this.face_mc.addChild(btn);
	this._arButtons.push(btn);
	var tf = addText(label, size, "#FFFFFF", "#000000", "center", 350)
	tf.x = 0;
	tf.y = - offset;
	btn.addChild(tf);
	
	return btn;
}

// ALL LEVELS
ScrGame.prototype.createLevel = function() {
	this.tfLevel.setText("Level " + this.curLevel);
	this.tfTitleLevel.setText("");
	this.itemResult.tf.setText("");
	this.itemResult.tfBalance.setText("");
	if(this.hintArrow){
		this.hintArrow.visible = false;
	}
	login_obj["level"] = this.curLevel;
	this._arObjectLevel = [];
	
	this.itemDao.act = ""
	this.itemDao.skin = ""
	
	switch (this.curLevel){
		case 1:
			this.itemDao.setSkin("egg");
			this.itemDao.setAct("Stay")
			this.itemDao.dead = false;
			this.itemDao.sprite.interactive = true;
			this.itemDao.visible = true;
			this.hintArrow.visible = true;
			this.itemDao.x = _W/2;
			this.itemDao.y = 500;
			this.damage = 40;
			break;
		case 2:
			this.itemDao.setSkin("dao");
			this.itemDao.setAct("RunMoney")
			this.itemDao.dead = false;
			this.itemDao.visible = true;
			this.itemDao.barDao.visible = false;
			this.itemDao.x = _W/2;
			this.itemDao.y = 500;
			this.valueLevelMax = 5000;
			this.tfTitleLevel.setText("Lost money: " + this.valueLevel + "/" + this.valueLevelMax);
			break;
		case 3:
			this.itemDao.dead = true;
			this.itemDao.visible = true;
			this.itemWall = addObj("itemWall", 660, 428);
			this.game_mc.addChild(this.itemWall);
			this.itemHome = addObj("itemHome", 1204, 364);
			this.gfx_mc.addChild(this.itemHome);
			this.valueLevelMax = 10;
			this.tfTitleLevel.setText("Bad proposal: " + this.valueLevel + "/" + this.valueLevelMax);
			break;
		case 4:
		case 5:
		default:
			this.itemDao.setSkin("dao");
			this.itemDao.setAct("Stay")
			this.itemDao.dead = false;
			this.itemDao.visible = true;
			this.itemDao.barDao.visible = true;
			this.itemDao.sprite.interactive = true;
			this.hintArrow.visible = true;
			this.itemDao.x = 900;
			this.itemDao.y = 500;
			this.damage = 30;
			var str = "itemHero";
			if(this.curLevel == 5){
				str = "itemHeroW";
				this.damage = 20;
			}
			
			this.hero = addObj(str, 660, 500, 1, -1);
			this.game_mc.addChild(this.hero);
			break;
	}
	
	if(this.hintArrow){
		this.hintArrow.x = this.itemDao.x + 70;
		this.hintArrow.y = this.itemDao.y - 90;
	}
}

ScrGame.prototype.createAccount = function() {	
	if(login_obj["privkey"]){
		this.tfIdUser.setText("you: " + login_obj["openkey"]);
	}else{
		var tfCreateKey = addText("Now you generate address", 40, "#FF8611", "#000000", "center", 800)
		tfCreateKey.x = _W/2;
		tfCreateKey.y = 150;
		this.face_mc.addChild(tfCreateKey);
		createjs.Tween.get(tfCreateKey).wait(2000).to({alpha:0},500)
		if(keyethereum){
			var dk = keyethereum.create();
			var privateKey = dk.privateKey;
			var address = ethUtil.privateToAddress(privateKey);
			address = ethUtil.toChecksumAddress(address.toString('hex'));
			privateKey = privateKey.toString('hex');
			login_obj["privkey"] = privateKey;
			login_obj["openkey"] = address;
			this.tfIdUser.setText("your key: " + address);
			saveData();
		} else {
			this.showError(ERROR_KEYTHEREUM);
		}
	}
}

ScrGame.prototype.createGUI = function() {
	this.itemResult = new PIXI.Container();
	this.itemResult.x = _W/2;
	this.itemResult.y = 190;
	this.itemResult.visible = false;
	this.face_mc.addChild(this.itemResult);
	
	var tfResult = addText("time:", 50, "#FF0000", "#000000", "center", 400)
	this.itemResult.addChild(tfResult);
	this.itemResult.tf = tfResult;
	var tfBalance = addText("+0", 30, "#FF0000", "#000000", "center", 400)
	tfBalance.y = 55;
	this.itemResult.addChild(tfBalance);
	this.itemResult.tfBalance = tfBalance;
	
	this.hintArrow = new PIXI.Container();
	this.hintArrow.x = this.itemDao.x + 70;
	this.hintArrow.y = this.itemDao.y - 90;
	this.game_mc.addChild(this.hintArrow);
	var hintArrow = addObj("hintArrow");
	hintArrow.rotation = 35*Math.PI/180;
	this.hintArrow.addChild(hintArrow);
	
	var offsetY = 25;
	var strUser = 'id'
	this.tfIdUser = addText("your key: " + strUser, 20, "#ffffff", "#000000", "left", 1000)
	this.tfIdUser.x = 20;
	this.tfIdUser.y = 10;
	this.face_mc.addChild(this.tfIdUser);
	this.tfBalance = addText("balance: 0", 20, "#ffffff", "#000000", "left", 400)
	this.tfBalance.x = 20;
	this.tfBalance.y = this.tfIdUser.y + offsetY*1;
	this.face_mc.addChild(this.tfBalance);
	this.tfTotalTime = addText("time: 0", 20, "#ffffff", "#000000", "left", 400)
	this.tfTotalTime.x = 20;
	this.tfTotalTime.y = this.tfIdUser.y + offsetY*2;
	this.face_mc.addChild(this.tfTotalTime);
	this.tfLevel = addText("Level " + this.curLevel, 50, "#FFEF0B", "#000000", "center", 400, 4)
	this.tfLevel.x = _W/2;
	this.tfLevel.y = 50;
	this.face_mc.addChild(this.tfLevel);
}

ScrGame.prototype.createWndInfo = function(str, callback, addStr) {
	if(this.wndInfo == undefined){
		this.wndInfo = new WndInfo(this);
		this.wndInfo.x = _W/2;
		this.wndInfo.y = _H/2;
		this.face_mc.addChild(this.wndInfo);
	}
	
	this.bWindow = true;
	this.wndInfo.show(str, callback, addStr)
	this.wndInfo.visible = true;
	this.curWindow = this.bWindow;
}

ScrGame.prototype.closeWindow = function(wnd) {
	this.curWindow = wnd;
	this.timeCloseWnd = 200;
}

ScrGame.prototype.refillBalance = function() {
	if(login_obj["openkey"] && options_ethereum){
		var url = "http://platform.dao.casino/topup/?client=" + login_obj["openkey"];
		window.open(url, "_self"); // "_blank",  "_self"
	}
}

ScrGame.prototype.shareFB = function() {	
	if (typeof(FB) != 'undefined' && FB != null ) {
		var urlGame = 'http://platform.dao.casino/games/Hack-DAO-game/game_hack_dao/';
		var urlImg = "http://platform.dao.casino/games/Hack-DAO-game/game_hack_dao/images/distr/icon_1024.png";
		/*FB.ui({
			method: 'share',
			href: urlGame,
		}, function(response){});*/
		
		
		FB.ui({
		  method: 'feed',
		  picture: urlImg,
		  link: urlGame,
		  caption: 'PLAY',
		  description: 'I passed Level ' + this.curLevel,
		}, function(response){});
	} else {
		console.log("FB is not defined");
	}
}

ScrGame.prototype.showSmartContract = function() {
	var url = urlSite + "address/{" + optionsTo + "}"
	window.open(url, "_blank"); 
}

ScrGame.prototype.exportKeys = function() {
	if(login_obj["openkey"] && options_ethereum){
		var url = "http://platform.dao.casino/export/?privkey="+login_obj["privkey"]+"&openkey="+login_obj["openkey"]
		window.open(url, "_blank"); 
	}
}

ScrGame.prototype.showError = function(value) {
	var str = "ERR"
	switch(value){
		case ERROR_KEYTHEREUM:
			str = "OOOPS! \n The key is not created. Try a different browser."
			break;
		case ERROR_TRANSACTION:
			str = "OOOPS! \n Transaction failed."
			this.resetGame();
			break;
		default:
			str = "ERR: " + value;
			break;
	}
	this.createWndInfo(str);
	
	if(this.hintArrow){
		this.hintArrow.visible = false;
	}
}

ScrGame.prototype.warningBalance = function() {
	var str = "Refill your account in the amount of 0.05 ETH."
	var addStr = "Refill";
	this.createWndInfo(str, this.refillBalance, addStr);
}

ScrGame.prototype.showWndClearLog = function() {
	var str = "Do you want to overwrite the keys?"
	var addStr = "Yes";
	this.createWndInfo(str, this.clearLog, addStr);
}

ScrGame.prototype.createIcoEthereum = function() {
	var dX = 100
	var _x = this.itemDao.x + Math.random()*dX - dX/2
	var _y = this.itemDao.y - 50
	var pt = {x:_x, y:_y}
	var str = "-"+String(this.damage)
	this.createObj(pt, "iconEthereum");
}

ScrGame.prototype.createText = function(point, str, color, t) {
	if(color){}else{color = "#FFFFFF"};
	if(t){}else{t = 1000};
	
	var mc = null;
	var newTf = true;
	
	for (var i = 0; i < this._arText.length; i++ ) {
		mc = this._arText[i];
		if (mc) {
			if (mc.dead) {
				mc.visible = true;
				mc.setText(str);
				newTf = false;
				break;
			}
		}
	}
	
	if (newTf) {
		// addText(text, size, color, glow, _align, width, px, bSc, font)
		mc = addText(str, 40, color, "0x000000");
		this.gfx_mc.addChild(mc);
		this._arText.push(mc);
	}
	
	mc.x = point.x;
	mc.y = point.y;
	mc.tLife = t;
	mc.dead = false;
}

ScrGame.prototype.createObj = function(point, name, sc) {	
	if(sc){}else{sc = 1};
	var mc = null;
	var newObj = true;
	
	for (var i = 0; i < this._arHolder.length; i++ ) {
		mc = this._arHolder[i];
		if (mc) {
			if (mc.dead && mc.name == name) {
				mc.visible = true;
				newObj = false;
				break;
			}
		}
	}
	
	if (newObj) {
		if(name == "itemProposal"){
			mc = new ItemProposal();
		} else {
			mc = addObj(name, 0, 0, sc);
		}
		if(name.search("cloud") > -1 ||
		name == "itemProposal"){
			this.game_mc.addChild(mc);
		} else {
			this.gfx_mc.addChild(mc);
		}
		this._arHolder.push(mc);
	}
	
	if(mc.name == "iconEthereum"){
		mc.speed = 10;
		mc.force = 20;
		mc.vX = 1;
		mc.tLife = 650;
		if(point.x < this.itemDao.x){
			mc.vX = -1;
		}
	} else if(mc.name == "cloud1" ||
	mc.name == "cloud2"){
		mc.speed = 3;
		mc.vX = 1;
		mc.tLife = 60000;
	} else if(mc.name == "itemMoney"){
		mc.vX = 1;
		mc.tgX = point.x;
		mc.speed = 5;
		mc.tLife = 60000;
		if(Math.random()>0.5){
			mc.vX = -1;
		}
	} else if(mc.name == "itemProposal"){
		if(Math.random() > 0.5){
			mc.setBody("Red");
		} else {
			mc.setBody("Green");
		}
		mc.setAct("Run");
		mc.setScaleX(-1);
		mc.action = "run";
		mc.state = 1;
		mc.vX = 1;
		mc.speed = 4;
		mc.tLife = 300000;
		mc.showMark = false;
		mc.mark.visible = false;
		this._arObjectLevel.push(mc);
	}
	
	if(mc.tLife == undefined){
		mc.tLife = 60000
	}
	mc.x = point.x;
	mc.y = point.y;
	mc.dead = false;
}

ScrGame.prototype.addHolderObj = function(obj){
	obj.visible = false;
	obj.dead = true;
	obj.x = _W + 150;
	obj.y = _H + 50;
}

// STAR
ScrGame.prototype.startGameEth = function(){
	var openkey = login_obj["openkey"].substr(2);
	
	$.get(urlSite+"api?module=proxy&action=eth_getTransactionCount&address="+login_obj["openkey"]+"&tag=latest&apikey=YourApiKeyToken",function(d){
		console.log("получили nonce "+d.result);
		var options = {};
		options.nonce = d.result;
		
		options.data = '0xc3fe3e28'; //собственно это надо отправить, чтоб вызвалась функция game();
		options.to = optionsTo; //адрес нашего смарт контракта
		options.data = '0xcddbe729000000000000000000000000000000000000000000000000000000000000000'+String(obj_game["game"].curLevel);
		options.gasPrice="0x737be7600";//web3.toHex('31000000000');
		options.gasLimit=0x927c0; //web3.toHex('600000');
		options.value = 50000000000000000; //  //ставка 0.02 эфира

		if(login_obj["privkey"]){
			if(buf == undefined){
				obj_game["game"].showError(ERROR_TRANSACTION);
			} else {
				var tx = new EthereumTx(options);
				tx.sign(new buf(login_obj["privkey"], 'hex')); //приватный ключ игрока, подписываем транзакцию

				var serializedTx = tx.serialize().toString('hex');
				
				console.log("Транзакция подписана: "+serializedTx);
				$.getJSON(urlSite+"api?module=proxy&action=eth_sendRawTransaction&hex="+serializedTx+"&apikey=YourApiKeyToken",function(d){
					//здесь будет ethereum txid по которому мы позже сможем вытащить результат.
					obj_game["game"].response("idGame", d.result) 
					console.log("Транзакция отправлена в сеть");
				});
			}
		}
	}, "json");
}

// RESULT
ScrGame.prototype.resultGameEth = function(val){
	if(this._gameOver){
		return false;
	}
	this._gameOver = true;
	var str = "";
	var strB = "";
	if(val == 1){
		str = "WIN!";
		strB = "";
		this.bResult = true;
		this.showWinEthereum = 10;
		this.itemDao.dead = true;
		this.btnNext.visible = true;
		if(this.curLevel == 1){
			this.itemDao.setAct("Win")
		} else if(this.curLevel == 2){
			this.itemDao.setAct("Win")
		} else if(this.curLevel == 4 || this.curLevel == 5){
			this.itemDao.setAct("Lose")
		}
		if(this.curLevel < 9){
		} else {
			console.log("YOU WIN!");
		}
		addWinLevel(this.curLevel);
		this.tfTitleLevel.setText(this.arTitle[this.curLevel]);
		this.btnShare.visible = true;
	} else {
		str = "LOSE";
		strB = "";
		 if(this.curLevel == 4 || this.curLevel == 5){
			this.itemDao.setAct("Win")
			if(this.hero){
				this.hero.rotation = 270*(Math.PI/180)
				this.hero.y += this.hero.h/2
			}
		}
		this.itemDao.dead = true;
		this.btnTry.visible = true;
		resetLevels();
	}
	login_obj["startGame"] = false;
	login_obj["curLevel"] = false;
	
	this.itemResult.tf.setText(str);
	this.itemResult.tfBalance.setText(strB);
	this.sendRequest("getBalance");
	this.itemResult.visible = true;
	this.startGame = false;
	this.timeTotal = 0;
	saveData();
}

ScrGame.prototype.clickHeroDao = function() {
	this.itemDao.initjiggle();
	if(this.itemDao.health > this.itemDao.healthMax*0.1 + this.damage){
		this.itemDao.health -=this.damage;
	} else {
		this.resurrection = this.resurrectionCur*75;
		var pt = {x:this.itemDao.x, y:this.itemDao.y - 100}
		this.createText(pt, "HA-HA-HA");
		if(this.itemDao.skin == "dao"){
			this.itemDao.setAct("Cure")
		}
	}
	this.createIcoEthereum();
}

ScrGame.prototype.healthDao = function() {
	if(this._gameOver){
		if(this.bResult){
			this.resurrection = -this.resurrectionCur*10
		} else {
			this.resurrection = this.resurrectionCur*20
		}
		this.itemDao.health += this.resurrection;
	} else {
		if(this.itemDao.health < this.itemDao.healthMax){
			if(this.itemDao.health > this.itemDao.healthMax*0.8){
				this.resurrection = this.resurrectionCur;
			} else {
				this.bHealthDao09 = true;
			}
			this.itemDao.health += this.resurrection;
		} else {
			if(this.bHealthDao09){
				this.resultGameEth(-1);
			}
		}
		if(this.curLevel == 1){
			if(this.itemDao.act == "Stay"){
				var fr = Math.ceil((this.itemDao.healthMax - this.itemDao.health)/(this.itemDao.healthMax/10));
				this.itemDao.sprite.img.gotoAndStop(fr);
			}
		}
	}
}

ScrGame.prototype.nextLevel = function() {
	this.resetGame();
	this.itemResult.tf.setText("");
	this.itemResult.tfBalance.setText("");
	this.createLevel();
}

ScrGame.prototype.clickCell = function(item_mc) {
	if(item_mc.name.search("btn") != -1){
		item_mc._selected = false;
		if(item_mc.over){
			item_mc.over.visible = false;
		}
	}
	
	if(item_mc.name == "btnReset"){
		this.showWndClearLog();
	} else if(item_mc.name == "btnLevels"){
		this.removeAllListener();
		showLevels();
	} else if(item_mc.name == "btnExport"){
		this.exportKeys();
	} else if(item_mc.name == "btnShare"){
		this.shareFB();
	} else if(item_mc.name == "btnSmart"){
		this.showSmartContract();
	} else if(item_mc.name == "btnStart"){
		if(obj_game["balance"] < 0.06 && options_ethereum &&
		options_debug == false){
			this.warningBalance();
		} else {
			this.createLevel();
			this.bSendRequest = false;
			this.startGame = true;
			if(options_ethereum){
				this.startGameEth();
			}
			this.btnStart.visible = false;
		}
	} else if(item_mc.name == "btnTry"){
		this.removeAllListener();
		showLevels();
	} else if(item_mc.name == "btnNext"){
		this.removeAllListener();
		showLevels();
	} else if(item_mc.name == "itemDao"){
		if(this._gameOver){
			return false;
		}
		if(this.startGame &&
		(this.curLevel == 1 || this.curLevel == 4 || this.curLevel == 5)){
			this.hintArrow.visible = false;
			this.clickHeroDao();
		}
	}
}

ScrGame.prototype.clickObject = function() {
	if(_mouseX && _mouseY){
		for (var i = 0; i < this._arObjectLevel.length; i++ ) {
			mc = this._arObjectLevel[i];
			if (mc) {
				if(hit_test_rec(mc, mc.w, mc.h, _mouseX, _mouseY)){
					if(this.curLevel == 3){
						if(mc.action == "run" && mc.sprite.scale.x == -1){
							mc.action = "climb";
							mc.showMark = true;
							mc.mark.visible = true;
							break;
						}
					}
				}
			}
		}
	}
}

ScrGame.prototype.sendUrlRequest = function(url, name) {
	// console.log("sendRequest:", name, url)	
	var xhr = new XMLHttpRequest();
	var str = url;
	xhr.open("GET", str, true);
	xhr.send(null);
	xhr.onreadystatechange = function() { // (3)
		if (xhr.readyState != 4) return;

		if (xhr.status != 200) {
			console.log("err:" + xhr.status + ': ' + xhr.statusText);
		} else {
			obj_game["game"].response(name, xhr.responseText) 
		}
	}
}

ScrGame.prototype.sendRequest = function(value) {
	if(options_ethereum){
		if(value == "game"){
			if(this.clickDAO == false){
				this.clickDAO = true;
				this.sendUrlRequest(urlRequest, "idGame");
			}
		} else if(value == "idGame"){
			if(this.idGame){
				this.clickDAO = false;
				var str = urlResult + "=" + this.idGame;
				this.sendUrlRequest(str, "resultGame");
			}
		} else if(value == "getBalance"){
			if(login_obj["openkey"]){
				var adress = login_obj["openkey"].replace('0x','');
				urlBalance = urlSite+"api?module=account&action=balance&address="+
							adress+"&tag=latest&apikey=YourApiKeyToken"
				var str = urlBalance;
				this.sendUrlRequest(str, "getBalance");
			}
		}
	}
}

ScrGame.prototype.response = function(command, value) {
	if(value == undefined){
		return false;
	}
	
	console.log("response:", command, value)	
	if(command == "idGame"){
		obj_game["idGame"] = value;
		login_obj["idGame"] = value;
		this.idGame = obj_game["idGame"];
		this.timeGetResult = 0;
		this.sendRequest("getBalance");
		login_obj["startGame"] = true;
		login_obj["curLevel"] = this.curLevel;
	} else if(command == "resultGame"){
		var val = Number(value);
		if(val == 0){
			this.clickDAO = true
			this.timeGetResult = 0;
			this.bSendRequest = false;
			this.sendRequest("getBalance");
		} else {
			this.resultGameEth(val);
		}
	} else if(command == "getBalance"){
		var obj = JSON.parse(value);
		obj_game["balance"] = toFixed((Number(obj.result)/1000000000000000000), 2);
		login_obj["balance"] = obj_game["balance"]
		this.tfBalance.setText("balance: " + obj_game["balance"]);
	}
}

ScrGame.prototype.updateText = function(diffTime){
	var mc;
	for (var i = 0; i < this._arText.length; i++ ) {
		mc = this._arText[i];
		if (mc) {
			if (mc.dead) {
				continue;
			}
			mc.y -= diffTime * 0.125;
			mc.tLife -= diffTime;
			if(mc.tLife < 0){
				this.addHolderObj(mc);
			}
		}
	}
}

ScrGame.prototype.updateHolder = function(diffTime){
	var mc;
	for (var i = 0; i < this._arHolder.length; i++ ) {
		mc = this._arHolder[i];
		if (mc) {
			if (mc.dead) {
				continue;
			}
			if(mc.name == "iconEthereum"){
				if(mc.force > 0){
					mc.force --;
					mc.y -= mc.speed*(mc.force/20)
				} else {
					mc.y += mc.speed
				}
				mc.x += mc.speed/3*mc.vX
			} else if(mc.name == "cloud1" ||
			mc.name == "cloud2"){
				mc.x += mc.speed*mc.vX
				if(mc.x > _W + mc.w){
					mc.tLife = 0;
					var t = Math.ceil(Math.random()*2)
					this.createObj({x:-400, y:50+Math.random()*100}, "cloud"+t)
				}
			} else if(mc.name == "itemProposal"){
				if(mc.state == 1){
					mc.x += mc.speed*mc.vX;
					var w = this.itemWall.w + mc.w;
					var h = this.itemWall.h + mc.h;
					if(hit_test_rec(this.itemWall, w, h, mc.x,mc.y)){
						if(mc.action == "run"){
							mc.vX = -mc.vX;
							mc.setScaleX(1);
						} else if(mc.action == "climb"){
							mc.state = 2;
							mc.setAct("Climb");
						}
					}
				} else if(mc.state == 2){
					mc.y -= mc.speed;
					if(mc.y+mc.h/2 < this.itemWall.y - this.itemWall.h/2){
						mc.state = 3;
						mc.setAct("Run");
					}
				} else if(mc.state == 3){
					mc.x += mc.speed;
					if(mc.x-mc.w/2 > this.itemWall.x + this.itemWall.w/2){
						mc.state = 4;
					}
				} else if(mc.state == 4){
					mc.y += mc.speed*5;
					if(mc.y > 425){
						mc.y = 425;
						mc.state = 1;
					}
				}
				
				if(mc.x > _W + mc.w || mc.x < -mc.w*2){
					if((mc.color == "Red" && mc.x > _W + mc.w) ||
					(mc.color == "Green" && mc.x < -mc.w*2)){
						this.valueLevel += 1;
						this.tfTitleLevel.setText("Bad proposal: " + this.valueLevel + "/" + this.valueLevelMax);
						if(this.valueLevel >= this.valueLevelMax){
							this.resultGameEth(-1);
						}
					}
					mc.tLife = 0;
				}
			} else if(mc.name == "itemMoney"){
				mc.y += mc.speed
				mc.x += mc.speed/5*mc.vX
				mc.rotation += mc.vX*(Math.PI/180)
				if(Math.abs(mc.tgX - mc.x) > 5){
					mc.vX = -mc.vX;
				}
				if(hit_test_rec(this.itemDao, 150, 70, mc.x,mc.y)){
					// this.createText(mc, "+ 100");
					mc.tLife = 0;
				}
				if(mc.y > _H + mc.h){
					this.valueLevel += 100;
					this.tfTitleLevel.setText("Lost money: " + this.valueLevel + "/" + this.valueLevelMax);
					this.createText(mc, "- 100");
					if(this.valueLevel >= this.valueLevelMax){
						this.resultGameEth(-1);
						this.itemDao.sprite.img.stop();
					}
					mc.tLife = 0;
				}
			}
			mc.tLife -= diffTime;
			if(mc.tLife < 0){
				this.addHolderObj(mc);
			}
		}
	}
}

ScrGame.prototype.resetTimer = function(){
	this.gameTime = getTimer();
}

ScrGame.prototype.update = function() {	
	var diffTime = getTimer() - this.startTime;
	
	if(this.startGame){
		this.timeTotal += diffTime;
		this.tfTotalTime.setText("time: " + Math.round(this.timeTotal/1000));
	}
	if(this.idGame && login_obj["startGame"]){
		this.timeGetResult += diffTime;
		if(this.timeGetResult >= TIME_GET_RESULT &&
		this.bSendRequest == false){
			this.bSendRequest = true;
			this.timeGetResult = 0;
			this.sendRequest("idGame");
		}
	}
	
	this.startTime = getTimer();
	
	if(options_pause){
		return false;
	}
	
	diffTime = getTimer() - this.gameTime;
	
	if(this.timeCloseWnd > 0 && this.curWindow){
		this.timeCloseWnd -= diffTime;
		if(this.timeCloseWnd < 100){
			this.timeCloseWnd = 0;
			this.curWindow.visible = false;
			this.curWindow = undefined;
			this.bWindow = false;
		}
	}
	
	for (var i = 0; i < this._arObject.length; i++) {
		var obj = this._arObject[i];
		obj.update(diffTime);
	}
	
	if(this.showWinEthereum > 0){
		this.showTimeEthereum -= diffTime
		if(this.showTimeEthereum < 0){
			this.showTimeEthereum = 100;
			this.showWinEthereum --;
			this.createIcoEthereum();
		}
	}
	
	this.updateText(diffTime);
	this.updateHolder(diffTime);
	this.healthDao();
	
	if(this.startGame){
		if(this.curLevel == 2){
			if(_mouseX && _mouseY){
				this.itemDao.initMove({x:_mouseX, y:_mouseY})
			}
			this.timeMoney += diffTime;
			if(this.timeMoney >= TIME_RESPAWN_MONEY){
				this.timeMoney = 0;
				var posX = Math.round(Math.random()*(_W-200))+100
				this.createObj({x:posX, y:-50}, "itemMoney")
			}
		} else if(this.curLevel == 3){
			this.timeProposal += diffTime;
			if(this.timeProposal >= TIME_RESPAWN_PROPOSAL){
				this.timeProposal = 0;
				this.createObj({x:-60, y:425}, "itemProposal")
			}
		}
	}
	
	this.gameTime = getTimer();
	this.startTime = getTimer();
}

ScrGame.prototype.checkButtons = function(evt){
	_mouseX = evt.data.global.x;
	_mouseY = evt.data.global.y;
	
	for (var i = 0; i < this._arButtons.length; i++) {
		var item_mc = this._arButtons[i];
		if(hit_test_rec(item_mc, item_mc.w, item_mc.h, _mouseX, _mouseY) &&
		item_mc.visible && item_mc.dead != true){
			if(item_mc._selected == false){
				item_mc._selected = true;
				if(item_mc.over){
					item_mc.over.visible = true;
				} else {
					if(item_mc.name == "btnShare"){
						item_mc.scale.x = 0.33;
						item_mc.scale.y = item_mc.scale.x;
					}
				}
			}
		} else {
			if(item_mc._selected){
				item_mc._selected = false;
				if(item_mc.over){
					item_mc.over.visible = false;
				} else {
					if(item_mc.name == "btnShare"){
						item_mc.scale.x = 0.3;
						item_mc.scale.y = item_mc.scale.x;
					}
				}
			}
		}
	}
}

ScrGame.prototype.touchHandler = function(evt){
	if(this.bWindow){
		return false;
	}
	var phase = evt.type;
	
	if(phase=='mousemove' || phase == 'touchmove' || phase == 'touchstart'){
		this.checkButtons(evt);
	} else if (phase == 'mousedown' || phase == 'touchend') {
		for (var i = 0; i < this._arButtons.length; i++) {
			var item_mc = this._arButtons[i];
			if(item_mc._selected){
				this.clickCell(item_mc);
				return;
			}
		}
		
		if(this.startGame){
			if(this.curLevel == 3){
				this.clickObject();
			}
		}
	}
}

ScrGame.prototype.removeAllListener = function(){
	this.interactive = false;
	this.off('mousedown', this.touchHandler);
	this.off('mousemove', this.touchHandler);
	this.off('touchstart', this.touchHandler);
	this.off('touchmove', this.touchHandler);
	this.off('touchend', this.touchHandler);
}