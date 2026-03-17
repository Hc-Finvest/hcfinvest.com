import Swap from "../models/Swap.js";

//Add Swap
export const addSwap = async (req, res) => {
  try {
    const { marketType, currencyPair, swapLong, swapShort } = req.body;

    // Validate
    if (!marketType || !currencyPair || !swapLong || !swapShort) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // Check if currencyPair already exists
    // const existing = await Swap.findOne({ currencyPair });
    // if (existing) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Currency Pair already exists",
    //   });
    // }

    // Create new swap record
    const newSwap = await Swap.create({
      marketType,
      currencyPair,
      swapLong,
      swapShort,
    });

    res.status(201).json({
      success: true,
      message: "Swap added successfully",
      data: newSwap,
    });
  } catch (error) {
    console.error("Error in addSwap:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//get currency Pairs 
export const getCurrencyPairsByMarket = async (req, res) => {
  try {
    const { marketType } = req.params;

    if (!marketType) {
      return res.status(400).json({ message: "marketType param is required" });
    }

    const swaps = await Swap.find({ marketType }).select("currencyPair -_id");
    console.log("Swaps from Controller"+swaps);
    const currencyPairs = swaps.map((item) => item.currencyPair);
    console.log("Currency Pairs from Controller"+currencyPairs)
    res.json(currencyPairs);
    console.log(currencyPairs);
  } catch (error) {
    console.error("Error fetching currency pairs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//Update Swap
export const updateSwap = async (req, res) => {
  try {
    const { marketType, currencyPair, swapLong, swapShort } = req.body;

    if (!marketType || !currencyPair || swapLong === "" || swapShort === "") {
      return res.status(400).json({ message: "All fields are required" });
    }

    const updated = await Swap.findOneAndUpdate(
      { marketType, currencyPair },
      { swapLong, swapShort },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Swap record not found" });
    }

    return res.json({
      message: "Swap updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};


//fetch swap byn market type
export const getSwapsByMarketType = async (req, res) => {
  try {
    const { marketType } = req.params;

    // lowercase to avoid mismatch
    const swaps = await Swap.find({ marketType });

    // transform to frontend format
    const formatted = swaps.map((item) => ({
      name: item.currencyPair,
      avg: item.swapLong,
      low: item.swapShort,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching swaps:", error);
    res.status(500).json({ error: "Server error" });
  }
};