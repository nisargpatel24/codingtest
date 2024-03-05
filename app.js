const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(bodyParser.json());

// Endpoint for fetching responses with filters
app.get('/:formId/filteredResponses', async (req, res) => {
  const formId = req.params.formId;
  const apiKey = 'sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912';
  const filters = JSON.parse(req.query.filters) || [];
  const inputs = JSON.parse(req.query.input).inputs
  // console.log(filters)
  console.log(inputs)

  try {
    // Fetch responses from Fillout API using provided API key and form ID
    const apiUrl = `https://api.fillout.com/v1/api/forms/${formId}/submissions`;
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    })
      .then(response => response.data)
      .catch(error => {
        console.error('Error:', error.response ? error.response.data : error.message);
      });

    // Filter responses based on specified conditions
    console.log(response)

    function isDateOrNumber(input) {
      if (!isNaN(input)) {
        // If it's not NaN, it's a number
        return 'Number';
      } else if (!isNaN(Date.parse(input))) {
        // If Date.parse doesn't return NaN, it's a valid date
        return 'Date';
      } else {
        // It's neither a number nor a valid date
        return 'Not a Date or Number';
      }
    }

    // Filter responses based on input conditions
  const filteredResponses = response.responses.filter(response => {
    return inputs.every(filter => {

    if(typeof filter.id !== 'string'){
      return false
    }

    const question = response.questions.find(q => q.id === filter.id);

    if (!question) return false;
    const type = isDateOrNumber(question.value)

    switch (filter.condition) {

      case 'equals':
        if (question.value && filter.value){
          console.log(question.value, filter.value)
          return question.value.toString() === filter.value.toString();
        }

      case 'does_not_equal':
        if (question.value && filter.value){
          return question.value.toString() !== filter.value.toString();
        }

      case 'greater_than':
        if( type === 'Date'){
          return new Date(question.value) > new Date(filter.value);
        }else if(type === 'Number'){
          return parseInt(question.value, 10) > parseInt(filter.value, 10)
        }else{
          return false
        }

      case 'less_than':
        if( type === 'Date'){
          return new Date(question.value) < new Date(filter.value);
        }else if(type === 'Number'){
          return parseInt(question.value, 10) < parseInt(filter.value, 10)
        }else{
          return false
        }

      default:
        return false;
    }
  });
});

console.log(filteredResponses);

    // Send the filtered response
    res.json({
      responses: filteredResponses,
      totalResponses: filteredResponses.length,
      pageCount: response.pageCount // Assuming pageCount is a property in the response object
    });
  } catch (error) {
    console.error('Error fetching responses:', error.response ? error.response.data : error.message);
    res.status(500).send('Internal Server Error');
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
