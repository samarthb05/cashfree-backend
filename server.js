const express = require("express");
const { Cashfree } = require("cashfree-pg");
require("dotenv").config();
const app = express();

const port = 5000;

app.use(express.json());

Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

//createOrder
app.post("/Order", async (req, res) => {
  Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID_TEST;
  Cashfree.XClientSecret = process.env.CASHFREE_CLIENT_SECRET_TEST;

  const { amount, name, phone, email } = req.body;
  const orderId = `sb25${Math.floor(Math.random() * 100000)}`;
  try {
    const order = await Cashfree.PGCreateOrder("2022-09-01", {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      order_note: "Payment",
      customer_details: {
        customer_id: orderId,
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
      },
      order_meta: {
        notify_url: "http://localhost:5000",
        return_url: "http://localhost:5000",
      },
    });

    const response = await Cashfree.PGPayOrder("2022-09-01", {
      payment_session_id: order.data.payment_session_id || "",
      payment_method: {
        upi: { channel: "link" },
      },
    });

    const payment = response.data?.data?.payload;

    res.status(201).send({
      message: "Order created successfully!",
      data: {
        orderId,
        amount,
        upiLink: payment?.web,
      },
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

//webhokk
app.post("/webhook", async (request, response) => {
  try {
    const data = request?.body;

    if (data?.data?.payment?.payment_status === "SUCCESS") {
      const orderId = data.data.order.order_id;
      const amount = data.data.order.order_amount || "0";

      const payment = {
        orderId,
        amount,
      };
    }
    response.send({
      status: "success",
      message: "Webhook data received for Cashfree",
    });
  } catch (error) {
    console.error("Error processing Cashfree webhook:", error);
    response.send({
      status: "success",
      message: "Webhook data received for Cashfree",
    });
  }
});
app.listen(port, () => {
  console.log(`server listen to ${port}`);
});
