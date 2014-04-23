(function($){

	var defaultConf = {
		row: 15,
		width: 36,
		resultBox: '.resultBox'
	}

	/**
	 * 基础类
	 * @param target
	 * @param config
	 * @constructor
	 */
	var Base = function(){
		// 写入总体的桌布的宽高
		this.board.width(this.row * this.width);

		// 是否开始游戏
		this.isStart = false
		// 定位是否结束
		this.isOver = false;
		// 记录棋子
		this.chessArr = [];
		// 是否轮到玩具下
		this.isPlayerGo = true;
		// 玩家最后落子位置
		this.playerLastChess = [];
		//机器人最后落子位置
		this.robotLastChess = [];
		// 玩家棋子颜色
		this.player = 'blank';
		this.robot = 'white';

		this.blankChess = -1;
		this.whiteChess = 1;

	};


	/**
	 * 桌布生成
	 * @constructor
	 */
	var Board = function(){

	}

	Board.prototype = {
		render: function(){
			var that = this,
				t = that.row;

			var i,
				k,
				tdArr = [];
			for(i=0; i<t; i++){
				that.chessArr[i] = [];
				for(k=0; k<t; k++){
					that.chessArr[i][k] = 0;
					tdArr.push('<div class="chess" style="float: left;width:'+that.width+'px;height:'+that.width+'px"></div>');
				}

			}

			that.board.html(tdArr.join(''));
		},
		clearBoard: function(){
			this.isOver = false;
			this.resultBox.empty();
			this.render();
		}
	}
	/**
	 * 连子个数
	 * @param r
	 * @param c
	 * @param color
	 * @returns {number}
	 */
	var connect =  function(r, c, color){
		var that = this;
		var num = 1;
		var x, y;

		// x轴 => 当前下子位置之前连接了多少个
		for(x = c-1; x>=0; x--){
			if(that.chessArr[r][x] == color){
				num++;
			} else {
				break;
			}
		}
		// x轴 => 当前下子位置之后连接了多少个
		for(x = c+1; x<that.row; x++){
			if(that.chessArr[r][x] == color){
				num++;
			} else{
				break
			}
		}
		// 如果够5个子，直接返回当前个数
		if(num >=5) return num;
		// 一个方向连接个数不够5个，其实就是1个
		num = 1;

		// Y轴 => 当前下子位置之前连接了多少个

		for(y = r-1; y>=0; y--){
			if(that.chessArr[y][c] == color){
				num++;
			} else {
				break;
			}
		}

		// Y轴 => 当前下子位置之后连接了多少个

		for(y = r+1; y<that.row; y++){
			if(that.chessArr[y][c] == color){
				num++;
			} else{
				break
			}
		}

		if(num >=5) return num;

		// \ => 之前的
		for(x = r-1, y = c-1; x>=0 && y>=0; x--, y--){
			if(that.chessArr[x][y] == color){
				num++;
			} else{
				break
			}
		}

		// \ => 之后的
		for(x = r + 1, y = c + 1; x < that.row && y < that.row; x++, y++){
			if(that.chessArr[x][y] == color){
				num++;
			} else{
				break
			}
		}

		if(num >=5) return num;

		// / => 之前的
		for(x = r-1, y = c+1; x>=0 && y<that.row; x--, y++){
			if(that.chessArr[x][y] == color){
				num++;
			} else{
				break
			}
		}

		// / => 之后的
		for(x = r + 1, y = c - 1; x < that.row && y >=0; x++, y--){
			if(that.chessArr[x][y] == color){
				num++;
			} else{
				break
			}
		}

		if(num >=5) return num;

	}

	/**
	 * 棋子
	 * @constructor
	 */
	var Chess = function(){

	}

	Chess.prototype = {
		start: function(){
			var that = this;

			that.clearBoard();

			that.board.on('click', '.chess', function(){
				// 正在游戏/游戏结束，点击棋盘无效
				if(!that.isPlayerGo || that.isOver) return

				// 没有开始，点击棋盘，直接开始
				if(!that.isStart){
					that.gameStart.call(that);
				}

				// 获取当前索引下的 行和列
				var index = $(this).index();
				var r = ~~(index/that.row);
				var c = index%that.row;


				if(that.chessArr[r][c] === 0){

					that.play.call(that, r, c, that.player);

					// 每次点击都为最后落子位置
					that.playerLastChess = [r][c];

					that.isWin.call(that, r, c);
				}

			});
		},
		// 开始
		gameStart: function(){
			var that = this;

			if(!that.isPlayerGo) that.robotPlay();

			that.isStart = true;

		},
		/**
		 * 下棋
		 * @param row
		 * @param cell
		 * @param color
		 */
		play: function(row, cell, color){
			var that = this;

			that.chessArr[row][cell] = color == 'blank' ? that.blankChess: that.whiteChess;

			var lastClass = color+'_last'

			if(color == that.robot){
				that.board.find('div.'+lastClass).removeClass(lastClass).addClass(color);
				that.board.find('div:eq('+(row * that.row + cell)+')').addClass(lastClass);
				return
			}

			that.board.find('div:eq('+(row * that.row + cell)+')').addClass(color);

		},
		isWin: function(r, c){
			var that = this;
			var chessColor = that.player == 'blank' ? that.blankChess : that.whiteChess;


			var n = connect.call(that, r, c, chessColor);

			if(n >=5){
				that.playerWin();
				return;
			}

			that.robotPlay();

		},
		robotPlay: function(){
			var that = this;

			that.isPlayerGo = false;

			var maxX = 0,
				maxY = 0,
				maxWeight = 0,
				x, y, tem;
			for (x = that.row-1; x >= 0; x--) {
				for (y = that.row-1; y >= 0; y--) {
					if (that.chessArr[x][y] !== 0) {
						continue;
					}
					tem = this.robotAutoPlay(x, y);
					if (tem > maxWeight) {
						maxWeight = tem;
						maxX = x;
						maxY = y;
					}
				}
			}
			this.play(maxX, maxY, this.robot);
			this.robotLastChess = [maxX, maxY];
			if ((maxWeight >= 100000 && maxWeight < 250000) || (maxWeight >= 500000)) {
				this.showResult(false);
				this.gameOver();
			}
			else {
				this.isPlayerGo = true;
			}


		},
		// TODO: 机器人实现
		robotAutoPlay: function(r, c){},
		showResult: function(isWin){
			this.isOver = true;
		},
		playerWin: function(){
			this.showResult(true);
			this.gameOver();
		},
		gameOver: function(){
			this.isStart = false;
		}
	}




	/**
	 * 五子棋
	 * @param obj
	 * @param config
	 * @constructor
	 */

	var FireRow = function(obj, config){
		this.setConfig(config);
		this.board = typeof obj == 'string' ? $(obj) : obj;
		this.resultBox = typeof this.resultBox == 'string' ? $(this.resultBox) : this.resultBox;
		Base.call(this);
		this.init();
	}
	// 继承这2个类
	$.extend(FireRow.prototype, new Board(), new Chess());

	FireRow.prototype.init = function(){
		this.render();
		this.clearBoard();
		this.start();
	}
	FireRow.prototype.setConfig = function(config){
		config = config || {};
		for(var i in defaultConf){
			this[i] = config[i] || defaultConf[i];
		}
	}
	new FireRow('.board');

})(jQuery);