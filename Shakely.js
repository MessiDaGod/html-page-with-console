(function () {
    'use strict';

    if (!Element.prototype.matches) {
        Element.prototype.matches =
            Element.prototype.msMatchesSelector ||
            Element.prototype.webkitMatchesSelector;
    }

    if (!Element.prototype.closest) {
        Element.prototype.closest = function (s) {
            var el = this;

            do {
                if (el.matches(s)) return el;
                el = el.parentElement || el.parentNode;
            } while (el !== null && el.nodeType === 1);
            return null;
        };
    }

    var resolveCallbacks = [];
    var rejectCallbacks = [];

    window.Shakely = {
        scrollEventConsolesToTop: function () {
            var myDiv = document.getElementById("event-console");
            myDiv.scrollTop = 0;
        },
        clearGitMessage: function () {
            document.getElementById("gitcommit").value = null;
        },
        plot: function (url) {
            this.webSocketConnected = false;
            this.webSocketHost = "wss://stream.binance.com:9443/ws/" + "BTCUSDT" + "@kline_" + "1";

            var el = document.getElementById("info");
            var url = "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=100";

            var con = new SimpleConsole({
                handleCommand: handle_command,
                placeholder: "Enter JavaScript, or ASCII emoticons :)",
                storageID: "simple-console demo"
            });
            document.body.appendChild(con.element);


            var params = url.split('&');

            for (let index = 0; index < params.length; index++) {
                const element = params[index];

                if (el != null && element.includes('limit'))
                {
                    el.textContent = element;
                    con.logHTML(element);
                }
            }

            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open(
                "GET",
                url,
                true
            );
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                    var json = JSON.parse(xmlhttp.responseText);
                    Shakely.candlestickChart = new Shakely.candleStickChart(
                        "candlestick"
                    );
                    for (var i = 0; i < json.length; ++i) {
                        Shakely.addCandlestick(
                            new Shakely.candleStick(
                                json[i][0], // timestamp
                                json[i][1], // open
                                json[i][4], // close
                                json[i][2], // high
                                json[i][3], // low
                            )
                        );
                    }
                    Shakely.draw();
                }
            };
            xmlhttp.setRequestHeader(
                "Content-Type",
                "application/x-www-form-urlencoded"
            );
            xmlhttp.send();

        },
        candleStick: function (timestamp, open, close, high, low) {
            this.timestamp = parseInt(timestamp);
            this.open = parseFloat(open);
            this.close = parseFloat(close);
            this.high = parseFloat(high);
            this.low = parseFloat(low);

        },

        candleStickChart: function (canvasElementID) {
            Shakely.canvas = document.getElementById(canvasElementID);
            Shakely.canvas.width = window.innerWidth;
            Shakely.canvas.height = window.innerHeight - 300;
            if (Shakely.canvas.width)
                Shakely.width = parseInt(Shakely.canvas.width);
            Shakely.height = parseInt(Shakely.canvas.height);
            Shakely.context = Shakely.canvas.getContext("2d");

            Shakely.canvas.addEventListener("mousemove", (e) => {
                Shakely.mouseMove(e);
            });
            Shakely.canvas.addEventListener("mouseout", (e) => {
                Shakely.mouseOut(e);
            });

            // Shakely.canvas.addEventListener("wheel", (e) => {
            //     Shakely.scroll(e);
            //     e.preventDefault();
            // });

            Shakely.canvas.style.backgroundColor = "#00090f";
            Shakely.context.font = '12px sans-serif';
            Shakely.gridColor = "#444444";
            Shakely.gridTextColor = "#aaaaaa";
            Shakely.mouseHoverBackgroundColor = "#eeeeee";
            Shakely.mouseHoverTextColor = "#000000";
            Shakely.greenColor = "#00cc00";
            Shakely.redColor = "#cc0000";
            Shakely.greenHoverColor = "#00ff00";
            Shakely.redHoverColor = "#ff0000";

            Shakely.context.lineWidth = 1;
            Shakely.candleWidth = 5;

            Shakely.marginLeft = 10;
            Shakely.marginRight = 100;
            Shakely.marginTop = 10;
            Shakely.marginBottom = 30;

            Shakely.yStart = 0;
            Shakely.yEnd = 0;
            Shakely.yRange = 0;
            Shakely.yPixelRange = Shakely.height - Shakely.marginTop - Shakely.marginBottom;

            Shakely.xStart = 0;
            Shakely.xEnd = 0;
            Shakely.xRange = 0;
            Shakely.xPixelRange = Shakely.width - Shakely.marginLeft - Shakely.marginRight;

            // these are only approximations, the grid will be divided in a way so the numbers are nice
            Shakely.xGridCells = 16;
            Shakely.yGridCells = 16;

            Shakely.b_drawMouseOverlay = false;
            Shakely.mousePosition = { x: 0, y: 0 };
            Shakely.xMouseHover = 0;
            Shakely.yMouseHover = 0;
            Shakely.hoveredCandlestickID = 0;

            // when zooming, just start at a later candlestick in the array
            Shakely.zoomStartID = 0;

            Shakely.technicalIndicators = [];
            Shakely.candlesticks = [];
        },
        scroll: function (e) {
            if (e.deltaY < 0) {
                Shakely.zoomStartID += 10;
                if (Shakely.zoomStartID > Shakely.candlesticks.length - 5) Shakely.zoomStartID = Shakely.candlesticks.length - 5;
            }
            else {
                Shakely.zoomStartID -= 10;
                if (Shakely.zoomStartID < 0) Shakely.zoomStartID = 0;
            }
            Shakely.draw();
        },
        addCandlestick: function (candlestick) {
            Shakely.candlesticks.push(candlestick);
        },
        mouseMove: function (e) {
            var getMousePos = (e) => {
                var rect = Shakely.canvas.getBoundingClientRect();
                return { x: e.clientX - rect.left, y: e.clientY - rect.top };
            };

            Shakely.mousePosition = getMousePos(e);
            Shakely.mousePosition.x += Shakely.candleWidth / 2;
            Shakely.b_drawMouseOverlay = true;
            if (Shakely.mousePosition.x < Shakely.marginLeft)
                Shakely.b_drawMouseOverlay = false;
            if (
                Shakely.mousePosition.x >
                Shakely.width - Shakely.marginRight + Shakely.candleWidth
            )
                Shakely.b_drawMouseOverlay = false;
            if (Shakely.mousePosition.y > Shakely.height - Shakely.marginBottom)
                Shakely.b_drawMouseOverlay = false;
            if (Shakely.b_drawMouseOverlay) {
                Shakely.yMouseHover = Shakely.yToValueCoords(Shakely.mousePosition.y);
                Shakely.xMouseHover = Shakely.xToValueCoords(Shakely.mousePosition.x);
                // snap to candlesticks

                var candlestickDelta =
                    Shakely.candlesticks[1].timestamp - Shakely.candlesticks[0].timestamp;
                Shakely.hoveredCandlestickID = Math.floor(
                    (Shakely.xMouseHover - Shakely.candlesticks[0].timestamp) /
                    candlestickDelta
                );
                Shakely.xMouseHover =
                    Math.floor(Shakely.xMouseHover / candlestickDelta) * candlestickDelta;
                Shakely.mousePosition.x = Shakely.xToPixelCoords(Shakely.xMouseHover);
                Shakely.draw();
            } else Shakely.draw();
        },
        mouseOut: function (e) {
            Shakely.b_drawMouseOverlay = false;
            Shakely.draw();
        },

        draw: function () {
            // clear background

            Shakely.context.clearRect(0, 0, Shakely.width, Shakely.height);

            Shakely.calculateYRange();
            Shakely.calculateXRange();

            Shakely.drawGrid();

            Shakely.candleWidth = Shakely.xPixelRange / (Shakely.candlesticks.length - Shakely.zoomStartID);
            Shakely.candleWidth--;
            if (Shakely.candleWidth % 2 == 0) Shakely.candleWidth--;

            for (var i = Shakely.zoomStartID; i < Shakely.candlesticks.length; ++i) {
                var color = (Shakely.candlesticks[i].close > Shakely.candlesticks[i].open) ? Shakely.greenColor : Shakely.redColor;

                if (i == Shakely.hoveredCandlestickID) {
                    if (color == Shakely.greenColor) color = Shakely.greenHoverColor;
                    else if (color == Shakely.redColor) color = Shakely.redHoverColor;
                }

                // draw the wick
                Shakely.drawLine(Shakely.xToPixelCoords(Shakely.candlesticks[i].timestamp), Shakely.yToPixelCoords(Shakely.candlesticks[i].low), Shakely.xToPixelCoords(Shakely.candlesticks[i].timestamp), Shakely.yToPixelCoords(Shakely.candlesticks[i].high), color);

                // draw the candle
                Shakely.fillRect(Shakely.xToPixelCoords(Shakely.candlesticks[i].timestamp) - Math.floor(Shakely.candleWidth / 2), Shakely.yToPixelCoords(Shakely.candlesticks[i].open), Shakely.candleWidth, Shakely.yToPixelCoords(Shakely.candlesticks[i].close) - Shakely.yToPixelCoords(Shakely.candlesticks[i].open), color);
            }

            Shakely.candleWidth = Shakely.xPixelRange / Shakely.candlesticks.length;
            Shakely.candleWidth--;
            if (Shakely.candleWidth % 2 == 0) Shakely.candleWidth--;

            for (var i = 0; i < Shakely.candlesticks.length; ++i) {
                var color =
                    Shakely.candlesticks[i].close > Shakely.candlesticks[i].open ? Shakely.greenColor : Shakely.redColor;

                if (i == Shakely.hoveredCandlestickID) {
                    if (color == Shakely.greenColor)
                        color = Shakely.greenHoverColor;
                    else if (color == Shakely.redColor)
                        color = Shakely.redHoverColor;
                }

                // draw the wick
                Shakely.drawLine(
                    Shakely.xToPixelCoords(Shakely.candlesticks[i].timestamp),
                    Shakely.yToPixelCoords(Shakely.candlesticks[i].low),
                    Shakely.xToPixelCoords(Shakely.candlesticks[i].timestamp),
                    Shakely.yToPixelCoords(Shakely.candlesticks[i].high),
                    color
                );

                // draw the candle
                Shakely.fillRect(
                    Shakely.xToPixelCoords(Shakely.candlesticks[i].timestamp) -
                    Math.floor(Shakely.candleWidth / 2),
                    Shakely.yToPixelCoords(Shakely.candlesticks[i].open),
                    Shakely.candleWidth,
                    Shakely.yToPixelCoords(Shakely.candlesticks[i].close) -
                    Shakely.yToPixelCoords(Shakely.candlesticks[i].open),
                    color
                );


            }

            // Draw the horizontal line either green or red based on current price.
            Shakely.drawLine(
                0,
                Shakely.yToPixelCoords(Shakely.candlesticks[Shakely.candlesticks.length - 1].close),
                Shakely.width,
                Shakely.yToPixelCoords(Shakely.candlesticks[Shakely.candlesticks.length - 1].close),
                Shakely.candlesticks[Shakely.candlesticks.length - 1].close > Shakely.candlesticks[Shakely.candlesticks.length - 1].open ? Shakely.greenColor : Shakely.redColor
            );


            for (var ii = 0; ii < Shakely.technicalIndicators.length; ++ii) {
                Shakely.technicalIndicators[ii].draw(this);
            }

            // draw mouse hover
            if (Shakely.b_drawMouseOverlay) {
                // price line
                Shakely.context.setLineDash([5, 5]);
                Shakely.drawLine(
                    0,
                    Shakely.mousePosition.y,
                    Shakely.width,
                    Shakely.mousePosition.y,
                    Shakely.mouseHoverBackgroundColor
                );

                // time line
                Shakely.context.setLineDash([5, 5]);
                var str = Shakely.roundPriceValue(Shakely.yMouseHover);
                var textWidth = Shakely.context.measureText(str).width;
                // fill popup box color
                Shakely.fillRect(
                    Shakely.width - 70,
                    Shakely.mousePosition.y - 10,
                    70,
                    20,
                    Shakely.mouseHoverBackgroundColor
                );
                // draw popup box for price on the far right when hovering over price
                Shakely.context.fillStyle = Shakely.mouseHoverTextColor;
                // fill popup box with price where mouse is hovered
                Shakely.context.fillText(
                    str,
                    Shakely.width - textWidth - 5,
                    Shakely.mousePosition.y + 5
                );

                // time line
                Shakely.context.setLineDash([5, 5]);
                Shakely.drawLine(
                    Shakely.mousePosition.x,
                    0,
                    Shakely.mousePosition.x,
                    Shakely.height,
                    Shakely.mouseHoverBackgroundColor
                );
                Shakely.context.setLineDash([]);
                str = Shakely.formatDate(new Date(Shakely.xMouseHover));
                textWidth = Shakely.context.measureText(str).width;
                Shakely.fillRect(
                    Shakely.mousePosition.x - textWidth / 2 - 5,
                    Shakely.height - 20,
                    textWidth + 10,
                    20,
                    Shakely.mouseHoverBackgroundColor
                );
                Shakely.context.fillStyle = Shakely.mouseHoverTextColor;
                Shakely.context.fillText(
                    str,
                    Shakely.mousePosition.x - textWidth / 2,
                    Shakely.height - 5
                );

                // data
                var yPos = Shakely.mousePosition.y - 95;
                if (yPos < 0) yPos = Shakely.mousePosition.y + 15;

                Shakely.fillRect(
                    Shakely.mousePosition.x + 15,
                    yPos,
                    100,
                    80,
                    Shakely.mouseHoverBackgroundColor
                );

                // drawing the pop up box showing all prices when hovering over

                Shakely.fillRect(Shakely.mousePosition.x + 30, yPos, 100, 80, "#FFFFFF");
                Shakely.context.lineWidth = 1;
                Shakely.drawRect(Shakely.mousePosition.x + 30, yPos, 100, 80, "#FFFFFF");
                Shakely.context.lineWidth = 1;

                Shakely.context.fillStyle = Shakely.mouseHoverTextColor;
                Shakely.context.fillText(
                    "Open: " + Shakely.candlesticks[Shakely.hoveredCandlestickID].open.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
                    Shakely.mousePosition.x + 30,
                    yPos + 15
                );
                Shakely.context.fillText(
                    "Close: " +
                    Shakely.candlesticks[Shakely.hoveredCandlestickID].close
                        .toFixed(2)
                        .replace(/\d(?=(\d{3})+\.)/g, "$&,"),
                    Shakely.mousePosition.x + 30,
                    yPos + 35
                );
                Shakely.context.fillText(
                    "High: " +
                    Shakely.candlesticks[Shakely.hoveredCandlestickID].high
                        .toFixed(2)
                        .replace(/\d(?=(\d{3})+\.)/g, "$&,"),
                    Shakely.mousePosition.x + 30,
                    yPos + 55
                );
                Shakely.context.fillText(
                    "Low: " +
                    Shakely.candlesticks[Shakely.hoveredCandlestickID].low
                        .toFixed(2)
                        .replace(/\d(?=(\d{3})+\.)/g, "$&,"),
                    Shakely.mousePosition.x + 30,
                    yPos + 75
                );
            }
        },
        addTechnicalIndicator: function (indicator) {
            indicator.onInit(this);
            this.technicalIndicators.push(indicator);
        },
        getCurrentPrice: function () {
            var el = document.getElementById("candleprice");
            if (el != null)
                return el.textContent;
        },
        setCurrentPrice: function (url) {
            Shakely.plot(url);
        },
        drawGrid: function () {
            // roughly divide the yRange into cells
            var yGridSize = Shakely.yRange / Shakely.yGridCells;
            // console.log("yGridSize = " + yGridSize);
            var currentprice = Shakely.candlesticks[Shakely.candlesticks.length - 1].close;
            // try to find a nice number to round to
            var niceNumber = Math.pow(10, Math.ceil(Math.log10(yGridSize)));
            if (yGridSize < 0.25 * niceNumber) niceNumber = 0.25 * niceNumber;
            else if (yGridSize < 0.5 * niceNumber) niceNumber = 0.5 * niceNumber;

            // find next largest nice number above yStart
            var yStartRoundNumber = Math.ceil(Shakely.yStart / niceNumber) * niceNumber;
            // find next lowest nice number below yEnd
            var yEndRoundNumber = Math.floor(Shakely.yEnd / niceNumber) * niceNumber;

            // DRAWING Y AXIS LABELS

            document.getElementById("candleprice").textContent = currentprice;

            var currentcolor =
                Shakely.candlesticks[Shakely.candlesticks.length - 1].close > Shakely.candlesticks[Shakely.candlesticks.length - 1].open ? Shakely.greenColor : Shakely.redColor;

            for (var y = yStartRoundNumber; y <= yEndRoundNumber; y += niceNumber) {

                Shakely.drawLine(
                    0,
                    Shakely.yToPixelCoords(y),
                    Shakely.width,
                    Shakely.yToPixelCoords(y),
                    Shakely.gridColor
                );


                var textWidth = Shakely.context.measureText(
                    Shakely.roundPriceValue(y)
                ).width;

                // Don't draw y axis value if it would overlap with the current price

                Shakely.context.fillStyle = Math.abs(y - currentprice) < 400 ? Shakely.canvas.style.backgroundColor : Shakely.gridTextColor;

                Shakely.context.fillText(
                    Shakely.roundPriceValue(y),
                    Shakely.width - textWidth - 5,
                    Shakely.yToPixelCoords(y) - 5
                );

                Shakely.context.fillStyle = Shakely.gridTextColor;

                Shakely.context.fillText(
                    Shakely.roundPriceValue(currentprice),
                    Shakely.width - textWidth - 5,
                    Shakely.yToPixelCoords(currentprice) - 5
                );
                Shakely.context.fillStyle = currentcolor;

                Shakely.context.fillText(
                    Shakely.roundPriceValue(currentprice),
                    Shakely.width - textWidth - 5,
                    Shakely.yToPixelCoords(currentprice) - 5
                );
            }

            // roughly divide the xRange into cells
            var xGridSize = Shakely.xRange / Shakely.xGridCells;

            // try to find a nice number to round to
            niceNumber = Math.pow(10, Math.ceil(Math.log10(xGridSize)));
            if (xGridSize < 0.25 * niceNumber) niceNumber = 0.25 * niceNumber;
            else if (xGridSize < 0.5 * niceNumber) niceNumber = 0.5 * niceNumber;

            // find next largest nice number above yStart
            var xStartRoundNumber = Math.ceil(Shakely.xStart / niceNumber) * niceNumber;
            // find next lowest nice number below yEnd
            var xEndRoundNumber = Math.floor(Shakely.xEnd / niceNumber) * niceNumber;

            // if the total x range is more than 5 days, format the timestamp as date instead of hours
            var b_formatAsDate = false;
            if (Shakely.xRange > 60 * 60 * 24 * 1000 * 5) b_formatAsDate = true;

            // DRAWING x AXIS LABELS

            for (var x = xStartRoundNumber; x <= xEndRoundNumber; x += niceNumber) {
                // vertical lines going up from x axis
                Shakely.drawLine(
                    Shakely.xToPixelCoords(x),
                    0,
                    Shakely.xToPixelCoords(x),
                    Shakely.height,
                    Shakely.gridColor
                );
                var date = new Date(x);
                var dateStr = "";
                if (b_formatAsDate) {
                    var day = date.getDate();
                    var month = date.toLocaleString('default', { month: 'long' }).substring(0, 3);
                    dateStr = month + " " + day + " " + date.getFullYear();
                } else {
                    dateStr = date.toLocaleTimeString();
                }
                Shakely.context.fillStyle = Shakely.gridTextColor;
                Shakely.context.fillText(
                    dateStr,
                    Shakely.xToPixelCoords(x) + 5,
                    Shakely.height - 5
                );
            }

        },
        calculateYRange: function () {
            for (var i = 0; i < Shakely.candlesticks.length; ++i) {
                if (i == 0) {
                    Shakely.yStart = Shakely.candlesticks[i].low;
                    Shakely.yEnd = Shakely.candlesticks[i].high;
                } else {
                    if (Shakely.candlesticks[i].low < Shakely.yStart) {
                        Shakely.yStart = Shakely.candlesticks[i].low;
                    }
                    if (Shakely.candlesticks[i].high > Shakely.yEnd) {
                        Shakely.yEnd = Shakely.candlesticks[i].high;
                    }
                }
            }
            Shakely.yRange = Shakely.yEnd - Shakely.yStart;
        },

        calculateXRange: function () {
            Shakely.xStart = Shakely.candlesticks[0].timestamp;
            Shakely.xEnd =
                Shakely.candlesticks[Shakely.candlesticks.length - 1].timestamp;
            Shakely.xRange = Shakely.xEnd - Shakely.xStart;
        },

        yToPixelCoords: function (y) {
            return (
                Shakely.height -
                Shakely.marginBottom -
                ((y - Shakely.yStart) * Shakely.yPixelRange) / Shakely.yRange
            );
        },

        xToPixelCoords: function (x) {
            return (
                Shakely.marginLeft +
                ((x - Shakely.xStart) * Shakely.xPixelRange) / Shakely.xRange
            );
        },

        yToValueCoords: function (y) {
            return (
                Shakely.yStart +
                ((Shakely.height - Shakely.marginBottom - y) * Shakely.yRange) /
                Shakely.yPixelRange
            );
        },

        xToValueCoords: function (x) {
            return (
                Shakely.xStart +
                ((x - Shakely.marginLeft) * Shakely.xRange) / Shakely.xPixelRange
            );
        },

        drawLine: function (xStart, yStart, xEnd, yEnd, color) {
            Shakely.context.beginPath();
            // to get a crisp 1 pixel wide line, we need to add 0.5 to the coords
            Shakely.context.moveTo(xStart + 0.5, yStart + 0.5);
            Shakely.context.lineTo(xEnd + 0.5, yEnd + 0.5);
            Shakely.context.strokeStyle = color;
            Shakely.context.stroke();
        },

        fillRect: function (x, y, width, height, color) {
            Shakely.context.beginPath();
            Shakely.context.fillStyle = color;
            Shakely.context.rect(x, y, width, height);
            Shakely.context.fill();
        },

        drawRect: function (x, y, width, height, color) {
            Shakely.context.beginPath();
            Shakely.context.strokeStyle = color;
            Shakely.context.rect(x, y, width, height);
            Shakely.context.stroke();
        },
        updateCandlestick: function (candlestickID, open, close, high, low) {
            if (candlestickID >= 0 && candlestickID < this.candlesticks.length) {
                this.candlesticks[candlestickID].update(open, close, high, low);
                for (var i = 0; i < this.technicalIndicators.length; ++i) {
                    this.technicalIndicators[i].onUpdateCandlestick(this, candlestickID);
                }
            }
        },
        MovingAverage: function (samples, color, lineWidth) {
            this.samples = samples;
            this.color = color;
            this.lineWidth = lineWidth;
            this.data = [];
        },
        onInit: function (candlestickChart) {
            for (var i = 0; i < candlestickChart.candlesticks.length; ++i) {
                // average the number of samples
                var avg = 0;
                var counter = 0;
                for (var j = i; j > i - this.samples && j >= 0; --j) {
                    avg += candlestickChart.candlesticks[j].close;
                    ++counter;
                }
                avg /= counter;
                this.data.push(avg);
            }
        },
        onAddCandlestick: function (candlestickChart, candlestickID) {
            // average the number of samples
            var avg = 0;
            var counter = 0;
            for (var i = candlestickID; i > candlestickID - this.samples && i >= 0; --i) {
                avg += candlestickChart.candlesticks[i].close;
                ++counter;
            }
            avg /= counter;
            this.data.push(avg);
        },
        onUpdateCandlestick: function (candlestickChart, candlestickID) {
            // average the number of samples
            var avg = 0;
            var counter = 0;
            for (var i = candlestickID; i > candlestickID - this.samples && i >= 0; --i) {
                avg += candlestickChart.candlesticks[i].close;
                ++counter;
            }
            avg /= counter;
            this.data[candlestickID] = avg;
        },
        MovingAverageDraw: function (candlestickChart) {
            var oldLineWidth = candlestickChart.context.lineWidth;
            candlestickChart.context.lineWidth = this.lineWidth;
            for (var i = candlestickChart.zoomStartID; i < this.data.length - 1; ++i) {
                candlestickChart.drawLine(candlestickChart.xToPixelCoords(candlestickChart.candlesticks[i].timestamp), candlestickChart.yToPixelCoords(this.data[i]), candlestickChart.xToPixelCoords(candlestickChart.candlesticks[i + 1].timestamp), candlestickChart.yToPixelCoords(this.data[i + 1]), this.color);
            }
            candlestickChart.context.lineWidth = oldLineWidth;
        },

        formatDate: function (date) {
            var day = date.getDate();
            var month = date.getMonth() + 1;
            var hours = date.getHours();
            var minutes = date.getMinutes();
            if (minutes < 10) minutes = "0" + minutes;
            return (
                month +
                "/" +
                day +
                "/" +
                date.getFullYear() +
                " - " +
                hours +
                ":" +
                minutes
            );
        },

        roundPriceValue: function (value) {
            if (value > 1.0) return (Math.round(value * 100) / 100)
                .toFixed(2)
                .replace(/\d(?=(\d{3})+\.)/g, "$&,");
            if (value > 0.001) return (Math.round(value * 1000) / 1000)
                .toFixed(2)
                .replace(/\d(?=(\d{3})+\.)/g, "$&,");
            if (value > 0.00001) return (Math.round(value * 100000) / 100000).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
            if (value > 0.0000001) return (Math.round(value * 10000000) / 10000000).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
            else return (Math.round(value * 1000000000) / 1000000000).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        },
        setCanvasSize: function () {
            if (document.getElementById("candlestick") && document.getElementById("candlestick").style.width != "1600")
                document.getElementById("candlestick").style.width = "1600";
        },
    };
}());
