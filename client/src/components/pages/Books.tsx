import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Card from "../modules/Card";
import "./Books.css";
import { get, post } from "../../utilities";
import LibraryCard from "../modules/LibraryCard";
import { Book } from "../../../../server/models/Book";
import { remove } from "../../utilities";
import BookInfo from "../modules/BookInfo";
import EditBook from "../modules/EditBook";
import useOutsideClick from "../modules/OutsideClick";
import { FaTrashAlt, FaPencilAlt } from "react-icons/fa";
import { Badge } from "@mantine/core";


type BooksProps = {
  userId: string;
};

const Books = (props: BooksProps) => {
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [library, setLibrary] = useState<Book[]>([]);
  const [search, setSearch] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [toShow, setToShow] = useState<Book | null>(null);
  const [genre, setGenre] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [rating, setRating] = useState<number>(0);
  const [status, setStatus] = useState<string>("read");
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [threeLib, setThreeLib] = useState<Book[][]>([[]]);
  
  const genreCallback = (genreval) => {
    setGenre(genreval);
  };

  const dateCallback = (dateval) => {
    setDate(dateval);
  };

  const ratingCallback = (ratingval) => {
    setRating(ratingval);
  };

  const statusCallback = (statusval) => {
    setStatus(statusval);
  };

  const hasThumbnail = (book, key) => {
    if (book.volumeInfo.imageLinks !== undefined) {
      return true;
    } else {
      return false;
    }
  };


  const searchBook = () => {
    axios
      .get(`https://www.googleapis.com/books/v1/volumes?q=${search}&key=AIzaSyDjnJHbxfCAqhtxJr1YYzleaQGQB8MdbEA&maxResults=10`)
      .then((res) => {
        setSearchResults(res.data.items.filter(hasThumbnail));
        setShowDropdown(true);
      })
      .catch((err) => console.log(err));
  };
  

  const handleFormSubmit = (event) => {
    event.preventDefault();
    searchBook();
  };  

  const checkLibrary = (book) => {
    if (library.length > 0) {
      for (let i = 0; i < library.length; i++) {
        if (library[i].title == book.volumeInfo.title && library[i].reader_id == props.userId) {
          return true;
        }
      }
    }
    return false;
  };

  const addBookToLibrary = (book) => {
    if (checkLibrary(book)) {
      alert("already in library");
      return;
    } else {
      post("/api/books", {
        title: book.volumeInfo.title,
        authors: book.volumeInfo.authors,
        isbn: book.volumeInfo.isbn,
        pages: book.volumeInfo.pageCount,
        dateread: date,
        cover: book.volumeInfo.imageLinks.smallThumbnail,
        rating: rating,
        genre: genre,
        publisher: book.volumeInfo.publisher,
        published_date: book.volumeInfo.publishedDate,
        preview_link: book.volumeInfo.previewLink,
        description: book.volumeInfo.description,
        status: status,
      }).then((newBook) => {
        setLibrary([...library, newBook]);
      });
      setShowDropdown(false);
    }
  };

  const addFromEdit = (book) => {
    post("/api/books", {
      title: book.title,
      authors: book.authors,
      isbn: book.isbn,
      pages: book.pages,
      dateread: date,
      cover: book.cover,
      rating: rating,
      genre: genre,
      publisher: book.publisher,
      published_date: book.published_date,
      preview_link: book.preview_link,
      description: book.description,
      status: status,
    }).then((newBook) => {
      setLibrary([...library, newBook]);
    });
  };

  const closeBookInfo = () => {
    setToShow(null);
  };

  const closeEditBook = () => {
    setEditBook(null);
  };

  const bookInfoPopup = (book) => {
    setToShow(book);
  };

  useEffect(() => {
    get("/api/books").then((books: Book[]) => {
      setLibrary(books);
    });
  }, []);

  const removeBook = (item) => {
    remove("/api/books/", { id: item._id }).then(() => {
      const newLibrary = library.filter((book) => book._id !== item._id);
      setLibrary(newLibrary);
    });
  };

  const noDropdown = () => {
    setToShow(null);
    setShowDropdown(false);
  };

  const dropdownRef = useRef(null);

  useOutsideClick(dropdownRef, () => {
    if (toShow === null) {
      setShowDropdown(false);
    }
  });

  const renderDropdown = () => {
    if (!showDropdown) return null;

    return (
      <div ref={dropdownRef} className="dropdown">
        {searchResults.map((book, index) => (
          <div key={index} onClick={() => bookInfoPopup(book)}>
            <Card book={book} />
          </div>
        ))}
      </div>
    );
  };

  const updateBook = (updatedBook) => {
    const bookIndex = library.findIndex(book => book._id === updatedBook._id);
    
    if (bookIndex !== -1) {
      const updatedLibrary = [...library];
      updatedLibrary[bookIndex] = updatedBook;
  
      setLibrary(updatedLibrary);
  
      post("/api/updateBook", { updatedBook }).then(() => {
      });
    }
  }

  useEffect(() => {
    setThreeLib([
      library.filter((book) => book.status === "currently reading"),
      library.filter((book) => book.status === "want to read"),
      library.filter((book) => book.status === "read")
    ]);
  }, [library]); 


  const LibrarySection = (lib: Book[], statusFilter: string) => {
    return (
      <div className="library-container">
        {lib.map((book, index) => {
          if (book.reader_id && book.reader_id === props.userId && book.status === statusFilter) {
            return (
              <div className="Books-container">
                <div className="Books-card" key={book._id}>
                  <LibraryCard userId={props.userId} book={book} />
                  <div className="button-container">
                    <button
                      className="delete-button"
                      onClick={() => removeBook(book)}
                    >
                      <FaTrashAlt />
                    </button>
                    <button
                      className="edit-button"
                      onClick={() => setEditBook(book)}
                    >
                      <FaPencilAlt />
                    </button>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}
        {toShow && (
            <div className="overlay">
              <BookInfo 
                onClose={closeBookInfo} 
                item={toShow} 
                datecb={dateCallback} 
                ratingcb={ratingCallback} 
                genrecb={genreCallback} 
                addbook={addBookToLibrary} 
                dropdowncb={noDropdown} 
                statuscb={statusCallback}/>
            </div>  
          )}
          {editBook && (
            <div className="overlay">
              <EditBook 
                onClose={closeEditBook} 
                item={editBook} 
                datecb={dateCallback} 
                ratingcb={ratingCallback} 
                genrecb={genreCallback} 
                updatebook={updateBook} 
                statuscb={statusCallback}/>
            </div>
          )}
      </div>
    );
  }

const sectionnames = ["Currently Reading", "Want to Read", "Read"];

  return (
    <div>
      <div className="Books-searchContainer">
        <form onSubmit={handleFormSubmit}>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyUp={searchBook}
            className="Books-input"
          />
        </form>
      </div>
      {renderDropdown()}
      <div className="">
        <div className="u-textCenter">
          <h2>Your Library</h2>
        </div>
        <br/>
        {
          threeLib.map((lib, index) => (
            <>
              <div className="u-textCenter">
                <div className="Books-lineOuterContainer">
                  <div className="Books-lineInnerContainer">
                    <hr></hr>
                  </div>
                </div>
                <div className="Books-badgeContainer">
                  <Badge variant="filled" size="xl">
                    {sectionnames[index]}
                  </Badge>
                </div>
              </div>
              {lib.filter((book) => book.reader_id === props.userId).length == 0 && (
              <div className="Books-emptyContainer">
                <div className="Books-emptyText">
                  <p>Nothing here yet! Add books to get started!</p>
                </div>
              </div>
              )}
              {lib.length != 0 && LibrarySection(lib, sectionnames[index].toLowerCase())}
            </>
          ))
        }
      </div>
    </div>
  );
};

export default Books;
