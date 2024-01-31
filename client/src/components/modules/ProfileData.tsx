import React, { useState, useEffect } from "react";
import { Chart as ChartJS, registerables } from "chart.js";
ChartJS.register(...registerables);
// import 'chartjs-adapter-date-fns';
// import 'date-fns';
import { Chart, Pie, Doughnut, Line, Bar } from "react-chartjs-2";
import "../../utilities.css";
import "../pages/Profile.css";
// import { Book } from "./Books";
// import Books from "./Books";
// import SingleBook from "../modules/SingleBook";
import { User } from "../../../../server/models/User";
import { get } from "../../utilities";
import { Book } from "../../../../server/models/Book";
import LibraryCard from "../modules/LibraryCard";

const primaryColor = getComputedStyle(document.documentElement).getPropertyValue("--primary");
const primaryDimColor = getComputedStyle(document.documentElement).getPropertyValue(
  "--primary--dim"
);
const greyColor = getComputedStyle(document.documentElement).getPropertyValue("--grey");

type ProfileProps = {
  userId: string;
};

const ProfileData = (props: ProfileProps) => {
  const [bookData, setBookData] = useState<Book[]>([]);
  const [username, setUsername] = useState<string>("Janelle Cai");
  const [library, setLibrary] = useState<Book[]>([]);
  const [currentBook, setCurrentBook] = useState<Book[]>([]);
  const [lifetimePages, setLifetimePages] = useState<number>(0);

  const [id, setId] = useState<string>("Janelle Cai");

  useEffect(() => {
    get("/api/whoami").then((user: User) => {
      if (user._id) {
        setUsername(user.name);
        setId(user._id);
      }
    });
  }, []);

  useEffect(() => {
    get("/api/books").then((books: Book[]) => {
      setLibrary(books);
    });
  }, []);

  /* Placeholder data */
  const loadBooks = () => {
    library.map((book) => {
      if (book.reader_id && book.reader_id == props.userId) {
        setBookData((prev) => [...prev, book]);
        console.log(" in load book book: ", book);
      }
    });
  };

  useEffect(loadBooks, [library]);

  /* Fiction vs. Nonfiction Pie Chart */
  const fictionCount = bookData.filter((bookObj) => bookObj.genre === "fiction").length;
  const nonficCount = bookData.filter((bookObj) => bookObj.genre === "non-fiction").length;
  const otherCount = bookData.filter(
    (bookObj) => bookObj.genre !== "fiction" && bookObj.genre !== "non-fiction"
  ).length;

  const ficData = {
    labels: ["Fiction", "Nonfiction", "Other"],
    datasets: [
      {
        data: [fictionCount, nonficCount, otherCount],
        backgroundColor: [primaryColor, primaryDimColor, greyColor],
        hoverOffset: 4,
      },
    ],
  };

  const createPagesData = () => {
    /* Total Pages Read Line Graph */
    // const bookCopy: Book[] = bookData.slice();
    // bookCopy.sort((a, b) => (a.dateread > b.dateread) ? 1 : -1);

    const pagesRead: number[] = bookData.map((book) => book.pages);

    const today = new Date();
    const startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const monthData: string[] = [];
    const pageData: number[] = [];
    for (let i = 0; i < 13; i++) {
      pageData.push(0);
    }

    let currDate = startDate;
    while (currDate <= endDate) {
      monthData.push(
        (currDate.getMonth() + 1).toString() + "/" + currDate.getFullYear().toString()
      );
      currDate = new Date(currDate.getFullYear(), currDate.getMonth() + 1, currDate.getDate());
    }

    const convertDate = (month: number, year: number) => {
      let val: number;
      if (year == today.getFullYear() - 1) {
        val = month - today.getMonth();
      } else {
        val = month + 12 - today.getMonth();
      }
      if (val >= 0 && val <= 12) {
        return val;
      }
      return -1;
    };

    for (let bk of bookData) {
      const newDate = new Date(bk.dateread);
      let convert = convertDate(newDate.getMonth(), newDate.getFullYear());
      if (convert != -1) {
        pageData[convert] += bk.pages;
      }
    }

    const pagesData = {
      labels: monthData,
      datasets: [
        {
          label: "Number of Pages",
          data: pageData,
          yAxisID: "Total Pages Read",
          fill: false,
          borderColor: greyColor,
          tension: 0.1,
        },
      ],
    };
    return pagesData;
  };

  useEffect(() => {
    for (let bk of bookData) {
      setLifetimePages((prev) => {
        if (bk.pages == undefined || bk?.current) {
          return prev;
        }
        return prev + bk.pages;
      });
    }
  }, [bookData]);

  useEffect(() => {
    for (let bk of bookData) {
      if (bk != undefined && bk?.current) {
        setCurrentBook((prev) => [...prev, bk]);
      }
    }
  }, [bookData]);

  const link = "https://bookblendr-7aw5.onrender.com/blends/" + id;

  return (
    <div className="Profile-flexContainer">
      <div className="Profile-chartContainer">
        <p className="Profile-chartHeader u-subheader">Fiction vs. Nonfiction</p>
        <Pie className="Profile-chartSubContainer" data={ficData} />
      </div>
      <div className="Profile-chartContainer">
        <p className="Profile-chartHeader u-subheader">Pages Read</p>
        <Bar
          className="Profile-chartSubContainer"
          data={createPagesData()}
          style={{
            width: 650,
            height: 2000,
          }}
          options={{
            maintainAspectRatio: true,
            scales: {
              // x: {
              //   type: 'time',
              //   time: {
              //     unit: 'month',
              //   }
              // },
              y: {
                beginAtZero: true,
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default ProfileData;