//TASK TWO 
const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017';

const dbName = 'plp_bookstore';
const collectionName ='books';

const genreFind = 'Fiction';
const yearBook = 1925;
const authorBook = 'Jane Austen';

async function run() {
    const client = new MongoClient(uri);
    try{
        await client.connect();

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

// FINDS BOOKS BY GENRE, YEAR AND AUTHOR 

        const books = await collection.find({genre: genreFind}).toArray();
        const year = await collection.find({published_year: {$gt: yearBook}}).toArray();
        const author = await collection.find({author: authorBook}).toArray();

       console.log('\nBooks in genre "${genreFind}":');
       console.log(books);

       console.log('\nBooks in year ${yearBook}:');
       console.log(year);

       console.log('\nBooks in author "${authorBook}":');
       console.log(author);
    

// UPDATES THE BOOK  PRICE BY GETTING THE TITTLE AND AUTHOR
        const filter = {
            title: "Brave New World",
            author: "Aldous Huxley"
        };
        const update ={
            $set: {price: 19.0}
        };
        const result = await collection.updateOne(filter, update);

        if (result.modifiedCount === 1){
            console.log("Price update successfully");
        } else {
            console.log("Book not found or price is already set");
        }

// DELETES A BOOK BY THE TITTLE
        const filter1 ={
            title: "Animal Farm"
        };
        const result1 = await collection.deleteOne(filter1);

        if (result1.deletedCount === 1){
            console.log("Book deleted successfully");
        }else {
            console.log("Book not found")
        }

//SHOWING BOOKS IN STOCK AND PUBLISHED AFTER A CERTAIN YEAR      
       const books1 = await collection.find({
        in_stock: true,
        published_year: {$gt: yearBook}
       }).toArray();
        console.log('Books published after ${published_year};');
        console.log(books1.length ? books1 : "none found.");

// BOOKS PROJECTION 
        const BooksProjection = await collection.find(
            {published_year: {$gt: 1925}},
            {projection: {title: 1, author:1, price: 1}}
        ).toArray();
        console.log('Books in the projection');
        console.log(BooksProjection);
        

// SORTS THE BOOKS IN ASCENDING ORDER ACCORDING TO THE PRICE
        const ascending = await collection.find().sort(
            {price: 1}
        ).toArray();
        console.log("Books are sorted by price- Low to High:")
        console.log(ascending);

        const descending = await collection.find().sort(
            {price: -1}
        ).toArray();
        console.log("Books are sorted by price- High to Low")
        console.log(descending);

// Use the `limit` and `skip` methods to implement pagination (5 books per page)

        const pageSize = 5;
        const page = 2;
        const books2 = await collection.find()
        .sort({title: 1})
        .skip((page -1)) * pageSize
        .limit(pageSize)
        .toArray();

        console.log('Showing page ${page} (books ${((page - 1) *pageSize) + 1} to ${page * pageSize}):');
        console.log(books2.length ? books2 : "No books found on this page");

// Create an aggregation pipeline to calculate the average price of books by genre

        const result3 = await collection.aggregate(
            [
                {$group: {
                    _id: "$genre",
                    avaragePrice: {$avg: "$price"}
                }
                }
            ]
        ).toArray();
        console.log("Avarage book price by genre:");
        console.log(result3);
// Create an aggregation pipeline to find the author with the most books in the collection
        const topAuthor = await collection.aggregate([
      {
        $group: {
          _id: "$author",           // Group by author
          bookCount: { $sum: 1 }    // Count books
        }
      },
      {
        $sort: { bookCount: -1 }    // Sort descending
      },
      {
        $limit: 1                   // Keep only top author
      }
    ]).toArray();

    console.log("📝 Author with the most books:");
    console.log(topAuthor);

// Implement a pipeline that groups books by publication decade and counts them
    const result4 = await collection.aggregate([
      {
        $project: {
          decade: {
            $multiply: [
              { $floor: { $divide: ["$year", 10] } },
              10
            ]
          }
        }
      },
      {
        $group: {
          _id: "$decade",
          bookCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();

    console.log("Book count by decade:");
    console.log(result);


// INDEX FOR TITLE , author and published year
    const resultIndex = await collection.createIndex(
        {title: 1,
            author: 1,
            published_year:1
        }
    );
    console.log("Index successfully created for 'title' 'author' 'published year'");
    console.log(resultIndex);
    
// using the explain() 

    //  Create compound index
    await collection.createIndex({ author: 1, published_year: 1 });

    // Run the query 
    console.log("\n⚡ With Index:");
    let indexedResult = await collection.find({
      author: "Jane Austen",
      published_year: 2005
    }).explain("executionStats");
    console.log("Documents scanned:", indexedResult.executionStats.totalDocsExamined);
    console.log("Execution time (ms):", indexedResult.executionStats.executionTimeMillis);
//
//


    } catch (error){
        console.error('Error:',error);
        console.error("Error updating price:",error);
        console.log("Error deleting book", error);
    } finally{
        await client.close();
    }    
}
run();

