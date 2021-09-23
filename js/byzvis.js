"use strict";

class Message {
	constructor(moment, source, target, status) {
		this.moment = parseInt(moment);
		this.source = parseInt(source);
		this.target = parseInt(target);
		this.status = parseInt(status);
	}

	isUnexpected() {
		return !(this.isSuccess() || this.isTampered() || this.isNotDelivered());
	}

	isSuccess() {
		return this.status === 1;
	}

	isNotDelivered() {
		return this.status === 2;
	}

	isTampered() {
		return this.status === 3;
	}
}

class CountMessageType {
	constructor(unexpected, success, notDelivered, tampered) {
		this.unexpected = parseInt(unexpected || "0");
		this.success = parseInt(success || "0");
		this.notDelivered = parseInt(notDelivered || "0");
		this.tampered = parseInt(tampered || "0");
	}

	inc(message) {
		if (message.isUnexpected()) {
			this.unexpected++;
		} else if (message.isSuccess()) {
			this.success++;
		} else if (message.isNotDelivered()) {
			this.notDelivered++;
		} else if (message.isTampered()) {
			this.tampered++;
		}
	}

	draw() {
		$("td#countSuccess").html(this.success);
		$("td#countNotDelivered").html(this.notDelivered);
		$("td#countTampered").html(this.tampered);
	}

	total() {
		return this.success + this.notDelivered + this.tampered + this.unexpected;
	}
}

class General {
	constructor(id, x, y) {
		id = parseInt(id);
		this.id = `G${id}`;
		this.x = x;
		this.y = y;
	}

	draw(body) {
		let svg = body.append("svg").attr("width", 80).attr("height", 50).attr('class', `general ${this.id}`)
			.attr('id', `${this.id}`);

		svg.append('circle')
			.attr('cx', 25)
			.attr('cy', 25)
			.attr('r', 20)
			.attr('stroke', 'black')
			.attr('fill', '#0c0101');

		let thisId = this.id;
		svg.append(`text`)
			.attr("x", 46)
			.attr("y", 25)
			.attr("dy", ".35em").text((d, i) => {
			return thisId;
		});
		$(`svg.${this.id}`).css({top: this.y, left: this.x, position: 'absolute'});
	}

	remove() {
		$(`svg#${this.id}`).remove();
	}

	drawLine(body, target, msgId, msgSizeX, msgSizeY) {
		let lineSizeX = Math.abs(target.x - this.x) + Math.round(msgSizeX / 2);
		let lineSizeY = Math.abs(target.y - this.y) + Math.round(msgSizeY / 2);
		let line = body.append("svg").attr('class', `line${msgId}`)
			.attr("width", lineSizeX)
			.attr("height", lineSizeY);
		const lineX = Math.min(this.x, target.x);
		const lineY = Math.min(this.y, target.y);
		$(`svg.line${msgId}`).css({
			top: lineY,
			left: lineX,
			position: 'absolute'
		});
		let lineStartX = Math.round(msgSizeX / 2);
		let lineStartY = Math.round(msgSizeY / 2);
		if (target.y > this.y) {
			let temp = lineStartY;
			lineStartY = lineSizeY;
			lineSizeY = temp;
		}
		if (target.x > this.x) {
			let temp = lineStartX;
			lineStartX = lineSizeX;
			lineSizeX = temp;
		}
		line.append('line').style("stroke", "lightgray")
			.attr("x1", lineStartX)
			.attr("y1", lineStartY)
			.attr("x2", lineSizeX)
			.attr("y2", lineSizeY);
		return line;
	}

	async sendMessage(body, target, message, duration) {
		let msgId = `${this.id}to${target.id}`;
		const msgSizeX = 50;
		const msgSizeY = 50;

		const line = this.drawLine(body, target, msgId, msgSizeX, msgSizeY);

		let msg = body.append("svg").attr("width", msgSizeX).attr("height", msgSizeY).attr('class', `message${msgId}`);
		let rect = msg.append("rect")
			.attr('x', 15)
			.attr('y', 15)
			.attr('width', 20)
			.attr('height', 20)
			.attr('stroke', 'black')
			.attr('fill', message.isUnexpected() ? '#bf0000' : '#69c2ef');
		$(`svg.message${msgId}`).css({top: this.y, left: this.x, position: 'absolute'});

		let transition = msg.transition()
			.attr("style", `top: ${target.y}px; left: ${target.x}px; position: absolute;`);
		if (message.isNotDelivered()) {
			transition = transition.attr('opacity', 0.25);
		} else if (message.isTampered()) {
			rect.transition().attr('fill', '#e8b510').duration(duration);
		}
		await transition.duration(duration).end();
		msg.transition().remove();
		line.remove();
	}
}

class ByzantineVisualization {
	constructor(data, width, height, timeSlot) {
		this.numberOfGenerals = 0;
		this.maxTime = 0;

		this.timeMessage = new Map();
		this.scoreBoard = new Map();
		for (let i = 0; i < data.length; i++) {
			const message = new Message(data[i].moment, data[i].source, data[i].target, data[i].status);
			let messages = this.timeMessage.get(message.moment) || [];
			messages.push(message);
			this.timeMessage.set(message.moment, messages);

			let counter = this.scoreBoard.get(message.moment) || new CountMessageType();
			counter.inc(message);
			this.scoreBoard.set(message.moment, counter);

			if (this.numberOfGenerals < message.source) {
				this.numberOfGenerals = message.source;
			}
			if (this.numberOfGenerals < message.target) {
				this.numberOfGenerals = message.target;
			}
			if (this.maxTime < message.moment) {
				this.maxTime = message.moment;
			}
		}
		this.numberOfGenerals++;
		this.maxTime++;
		let tempScoreBoard = this.scoreBoard;
		this.scoreBoard = new Map();
		for (let i = 0; i < this.maxTime; i++) {
			let counter = tempScoreBoard.get(i) || new CountMessageType();
			if (i > 0) {
				let previous = this.scoreBoard.get(i - 1);
				counter.success += parseInt(previous.success);
				counter.unexpected += parseInt(previous.unexpected);
				counter.notDelivered += parseInt(previous.notDelivered);
				counter.tampered += parseInt(previous.tampered);
			}
			this.scoreBoard.set(i, counter);
		}

		this.generals = [];
		const radius = 15 * this.numberOfGenerals;
		for (let i = 0; i < this.numberOfGenerals; i++) {
			let general = new General(i,
				Math.round(width / 2 + radius * Math.cos(i * 2 * Math.PI / this.numberOfGenerals)),
				Math.round(height / 2 + radius * Math.sin(i * 2 * Math.PI / this.numberOfGenerals))
			);
			this.generals.push(general);
		}

		this.timeSlot = timeSlot;
		if (!this.timeSlot) {
			this.timeSlot = 1000;
		}
		this.current = 0;
		this.interval = null;
	}

	draw(body, timeRange) {
		let totalOfMessages = this.scoreBoard.get(this.maxTime - 1).total();
		d3.select("div #generalsTitle").append("p").attr('id', `title`)
			.text(`${this.numberOfGenerals} generals, ${this.maxTime} time slots, and total of ${totalOfMessages} messages`);

		for (let general of this.generals) {
			general.draw(body);
		}
		$(timeRange).attr({
			"min": 0,
			"max": this.maxTime,
			"value": 0,
		});
	}

	remove() {
		for (let general of this.generals) {
			general.remove();
		}
		$('p#title').remove();
	}

	start(body, timeRange) {
		if (!this.interval) {
			this.interval = setInterval(() => {
				if (this.timeMessage.has(this.current)) {
					let messages = this.timeMessage.get(this.current);
					for (let message of messages) {
						const source = this.generals[message.source];
						const target = this.generals[message.target];

						// This async is ignored cause all the messages should be sent at the same time
						source.sendMessage(body, target, message, this.timeSlot);
					}
				}

				$(timeRange).val(this.current);
				if (this.current === this.maxTime) {
					console.log("Finished");
					this.stop();
					this.current = 0;
					$(timeRange).val(0);
					new CountMessageType().draw();
				} else {
					this.updateScore();
					this.current++;
				}
			}, this.timeSlot);
		}
	}

	stop() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
	}

	isRunning() {
		return this.interval;
	}

	updateScore() {
		let current = Math.min(this.current, this.maxTime - 1);
		if (current > 0) {
			let currentScore = this.scoreBoard.get(current);
			currentScore.draw();
		} else {
			new CountMessageType().draw();
		}
	}
}

function loadAndDraw(body, timeRange, selectProblem, byzVis, timeSlot, response) {
	if (byzVis) {
		byzVis.remove();
	}
	d3.csv($(selectProblem).val()).then((data) => {
		const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
		const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

		let byzVis = new ByzantineVisualization(data, width, height, timeSlot);
		byzVis.draw(body, timeRange);
		response(byzVis);
	});
}
