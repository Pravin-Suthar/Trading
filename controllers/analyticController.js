const { db } = require("../models/index");
const Nifty = db.nifty;

const importAllStockModels = (db) => {
    const stockModels = {};
    Object.keys(db).forEach(modelName => {
        if (modelName.startsWith('Stock_')) {
            stockModels[modelName] = db[modelName];
        }
    });
    return stockModels;
};
const axios = require("axios");
const moment = require('moment');
const { Op, fn, col } = require("sequelize");

exports.getData = async (req, res) => {
    const { startDt, endDt } = req.body;

    const TOKEN = "if token is need add it"; // Your token in case neededs
    const URL_TEMPLATE = `https://something.com/historical/`; // You can use any api to get the data , Upstox, Icici breeze lots of good brokers out there giving back to society

    const getDatesInRange = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const dates = [];
        while (startDate <= endDate) {
            dates.push(startDate.toISOString().split("T")[0]);
            startDate.setDate(startDate.getDate() + 1);
        }
        return dates;
    };

    try {
        const dates = getDatesInRange(startDt, endDt);
        for (const date of dates) {
            const url = URL_TEMPLATE.replace("{FROM}", date).replace("{TO}", date);
            console.log("Fetching data for the url:", url);
            const response = await axios.get(url, {
                headers: {
                    Authorization: `${TOKEN}`
                }
            });
            const candles = response['data']['data']['candles'];
            try {
                const bulkData = candles.map(candle => {
                    /* THIS BELOW IS THE PART WHERE I AM PUSING THE DATA INTO THE DB YOU CAN USE ANY SERVICE PROVIDER / API TO GET THE 1MIN DATA OF THE NIFTY INDEX FOR PAST 3-4YR
                    IF YOU HAVE ACCOUNT WITH ICICI BREEZE THEN YOU CAN USE ICICI BREEZE API TO GET THE DATA FOR ANALYSIS 
                    @The data have to be stored in you local instance of the mysql database with timestamp, open, high, low, close, volume, openInterest */
                    const [timestamp, open, high, low, close, volume, openInterest] = candle;
                    let updatedTimestamp = timestamp;
                    updatedTimestamp = moment(timestamp).add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
                    return {
                        timestamp: updatedTimestamp,
                        open: parseFloat(open),
                        high: parseFloat(high),
                        low: parseFloat(low),
                        close: parseFloat(close),
                        volume: parseInt(volume, 10),
                        openInterest: parseInt(openInterest, 10),
                    };
                });
                // Perform bulk insert
                await Nifty.bulkCreate(bulkData);
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: "Error inserting the data",
                    error: error.message
                });
            }
        }
        return res.json({
            success: true,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch data from Zerodha API",
            error: error.message
        });
    }
};


exports.doAnalytics = async (req, res) => {
    try {
        let {
            startDate, // Date
            endDate, // Date
            entryBuffer, // Number
            slBuffer, // Number
            takeProfitBuffer,
            exitTradeTime,
            considerCandleStart,
            considerCandleEnd,
        } = req.body;

        startDate = new Date(startDate + "Z");
        endDate = new Date(endDate + "Z");

        const formatDate = (date) => {
            return date.toISOString().split("T")[0];
        };

        let completeData = await Nifty.findAll({
            attributes: ["id", "timestamp", "open", "high", "low", "close"],
            where: {
                timestamp: {
                    [Op.gte]: startDate,
                    [Op.lte]: endDate,
                },
            },
        });


        const filterDataForDay = (data, startTime, endTime) => {
            return data.filter(item => {
                const timestamp = new Date(item.timestamp);
                return timestamp >= startTime && timestamp <= endTime;
            });
        };


        let totalProfit = 0;
        for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
            // Skip weekends
            if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
                continue;
            }

            const formattedDate = formatDate(currentDate);

            const considerCandleStartDate = new Date(`${formattedDate}T${considerCandleStart}Z`);
            const considerCandleEndDate = new Date(`${formattedDate}T${considerCandleEnd}Z`);

            const breakOutCheckingCandleDate = new Date(considerCandleEndDate);
            breakOutCheckingCandleDate.setMinutes(breakOutCheckingCandleDate.getMinutes() + 1);

            const exitTradeTimeDate = new Date(`${formattedDate}T${exitTradeTime}Z`);
            const todaysEndDate = new Date(`${currentDate}Z`);
            todaysEndDate.setHours(22, 0, 0, 0);
            let dataOfCompleteSingleDay = filterDataForDay(completeData, considerCandleStartDate, todaysEndDate);

            if (dataOfCompleteSingleDay.length === 0 || dataOfCompleteSingleDay == undefined) {
                continue;
            }

            const filteredDataForConsiderRg = dataOfCompleteSingleDay.filter(item => {
                const timestamp = new Date(item.timestamp);
                return timestamp >= considerCandleStartDate && timestamp <= considerCandleEndDate;
            });

            // Calculate the max high and min low from the filtered data
            const considerCandleHighValue = Math.max(...filteredDataForConsiderRg.map(item => Number(item.high)));
            const considerCandleLowValue = Math.min(...filteredDataForConsiderRg.map(item => Number(item.low)));


            let symbol = "NIFTY";
            let action = "";
            let entryTime;
            let entryPrice;
            let stopLoss;
            let takeProfit;
            let netPnl;

            const filteredData = filterDataForDay(dataOfCompleteSingleDay, breakOutCheckingCandleDate, todaysEndDate);
            if (filteredData.length == 0 || filteredData == undefined) {
                continue;
            }
            // Loop through filteredData
            for (let j = 0; j < filteredData.length; j++) {
                if (
                    Number(filteredData[j]["high"]) >
                    Number(considerCandleHighValue) + entryBuffer
                ) {
                    entryPrice = Number(considerCandleHighValue) + entryBuffer;
                    entryTime = filteredData[j].timestamp;
                    action = "BUY";
                    stopLoss = Number(considerCandleLowValue) - slBuffer;
                    takeProfit = Number(considerCandleHighValue) + takeProfitBuffer;
                    break;
                } else if (
                    Number(filteredData[j]["low"]) <
                    Number(considerCandleLowValue) - entryBuffer
                ) {
                    entryPrice = Number(considerCandleLowValue) - entryBuffer;
                    entryTime = filteredData[j].timestamp;
                    action = "SELL";
                    stopLoss = Number(considerCandleHighValue) + slBuffer;
                    takeProfit = Number(considerCandleLowValue) - takeProfitBuffer;
                    break;
                }
                let currentTimestamp = new Date(filteredData[j].timestamp);
                currentTimestamp.setMinutes(currentTimestamp.getMinutes() + 1);
                filteredData[j].timestamp = currentTimestamp.toISOString();
            }
            // Now we have the entryTime, action, stopLoss and takeProfit and we need to check if the trade is successful or not
            // We will check for the exitTradeTime and if the trade is not successful then we will exit the trade at the exitTradeTime
            let sellPrice;
            let exitTime;
            let status;

            const filteredDataforValidation = filterDataForDay(dataOfCompleteSingleDay, entryTime, todaysEndDate);
            if (filteredDataforValidation.length == 0 || filteredDataforValidation == undefined) {
                continue;
            }
            for (let k = 0; k < filteredDataforValidation.length; k++) {
                if (action === "BUY") {
                    if (filteredDataforValidation[k]["low"] < stopLoss) {
                        sellPrice = stopLoss;
                        exitTime = filteredDataforValidation[k].timestamp;
                        netPnl = stopLoss - entryPrice;
                        status = "SL";
                        break;
                    } else if (filteredDataforValidation[k]["high"] > takeProfit) {
                        sellPrice = takeProfit;
                        exitTime = filteredDataforValidation[k].timestamp;
                        netPnl = takeProfit - entryPrice;
                        status = "TP";
                        break;
                    } else if (
                        new Date(filteredDataforValidation[k].timestamp) >
                        new Date(exitTradeTimeDate)
                    ) {
                        sellPrice = filteredDataforValidation[k]["close"];
                        exitTime = filteredDataforValidation[k].timestamp;
                        netPnl = filteredDataforValidation[k]["close"] - entryPrice;
                        status = "ET";
                        break;
                    }
                }
                if (action === "SELL") {
                    if (filteredDataforValidation[k]["high"] > stopLoss) {
                        sellPrice = stopLoss;
                        exitTime = filteredDataforValidation[k].timestamp;
                        netPnl = entryPrice - stopLoss;
                        status = "SL";
                        break;
                    } else if (filteredDataforValidation[k]["low"] < takeProfit) {
                        sellPrice = takeProfit;
                        exitTime = filteredDataforValidation[k].timestamp;
                        netPnl = entryPrice - takeProfit;
                        status = "TP";
                        break;
                    } else if (
                        new Date(filteredDataforValidation[k].timestamp) >
                        new Date(exitTradeTimeDate)
                    ) {
                        sellPrice = filteredDataforValidation[k]["close"];
                        exitTime = filteredDataforValidation[k].timestamp;
                        netPnl = entryPrice - filteredDataforValidation[k]["close"];
                        status = "ET";
                        break;
                    }
                }
                let currentTimestamp = new Date(filteredDataforValidation[k].timestamp);
                currentTimestamp.setMinutes(currentTimestamp.getMinutes() + 1);
                filteredDataforValidation[k].timestamp = currentTimestamp.toISOString();
            }

            console.log(`Trade Details:- Symbol: ${symbol} - Action: ${action} - Entry Price: ${entryPrice} - Entry Time: ${entryTime} - Stop Loss: ${stopLoss} - Take Profit: ${takeProfit} - Exit Price: ${sellPrice} - Exit Time: ${exitTime} - Status: ${status} - ${netPnl}`);
            totalProfit = totalProfit + netPnl;

            // Now we need to clear the variables
            action = "";
            entryTime = "";
            stopLoss = "";
            takeProfit = "";
            sellPrice = "";
            exitTime = "";
            status = "";
            netPnl = "";
            dataOfCompleteSingleDay = [];
        }

        res
            .status(201)
            .json({ msg: "Trades were validated successfully", totalProfit: totalProfit });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ error: "Registration failed" });
    }
};
