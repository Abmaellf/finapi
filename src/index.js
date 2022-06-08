const { request } = require("express");
const { response } = require("express");
const express = require("express");
const res = require("express/lib/response");
const { v4: uuidv4 } = require("uuid")

const app = express();

app.use(express.json());

const customers = [];

/**
    cpf - string
    name - string
    id  -  uuid
    statement []
*/
function verifyExistsAcountCPF(request, response, next) {
    const { cpf } = request.headers;

    const customer = customers.find(customer => customer.cpf === cpf);

    // validando a conta
    if (!customer) {
        return response.status(400).json({ "erro": "Customer not found" });
    }

    request.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount;
        } else {
            return acc + operation.amount;
        }
    });
    return balance;
}



//Criando uma conta
app.post("/account", (request, response) => {

    const { cpf, name } = request.body;

    const customerAlredyExists = customers.some(
        (customer) => customer.cpf === cpf
    )

    if (customerAlredyExists) {
        return response.status(400).json({
            erro: "Customer already exists "
        })
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    });

    return response.status(201).send();

});

//Middleware para todos abaixo
//app.use(verifyExistsAcountCPF);


//Buscando uma conta
app.get("/statement", verifyExistsAcountCPF, (request, response) => {

    const { customer } = request;

    return response.json(customer.statement);

})

//Efetuando um deposito
app.post("/deposit", verifyExistsAcountCPF, (request, response) => {

    const { description, amount } = request.body;

    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);
    return response.status(201).send();

})

app.post("/withdraw", verifyExistsAcountCPF, (request, response) => {

    const { amount } = request.body;
    const { customer } = request;
    const balance = getBalance(customer.statement);
    if (balance < amount) {
        return response.status(400).json({ error: "Insufficiente funds" });
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    };
    customer.statement.push(statementOperation);

    return response.status(201).send();

})

//Buscando uma conta por data
app.get("/statement/date", verifyExistsAcountCPF, (request, response) => {

    const { customer } = request;
    const { date } = request.query;

    const dateFormt = new Date(date + " 00:00");

    const statement = customer.statement.filter(
        (statement) =>
            statement.created_at.toDateString() ===
            new Date(dateFormt).toDateString()
    );

    return response.json(statement);
})

app.put("/account", verifyExistsAcountCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;
    return response.status(201).send();
})

app.get("/account", verifyExistsAcountCPF, (request, response) => {
    const { customer } = request;

    return response.json(customer);
})


/*Primeira forma de fazer*/

app.delete("/account", verifyExistsAcountCPF, (request, response) => {
    const { customer } = request;

    //splice opção simples
    customers.splice(customers.indexOf(customer), 1);





    return response.status(200).json(customers);

});




/*Segunda forma de fazer com o splice *
app.delete("/account/:cpf", (request, response) => {
    const { cpf } = request.params;

    const customerIndex = customers.findIndex(customer => customer.cpf === cpf);

    if (customerIndex === -1) {
        return response.status(404).json({ error: 'Customer Not Found' });
    }

    customers.splice(customerIndex, 1);

    //return response.status(204).json();
    return response.status(200).json(customers);

});
*/

app.get("/balance", verifyExistsAcountCPF, (request, response) => {

    const { customer } = request;

    const balance = getBalance(customer.statement);

    return response.json(balance);
});


app.listen(3333);