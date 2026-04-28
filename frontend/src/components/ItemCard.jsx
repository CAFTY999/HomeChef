import "./itemcard.css";
import { useState } from "react";

export default function ItemCard({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* CARD */}
      <div className="card" onClick={() => setOpen(true)}>
        <img src="https://via.placeholder.com/200" alt="food" />

        <h3>{item.name}</h3>
        <p>₹{item.price}</p>
        <p>👨‍🍳 {item.chefName}</p>
        <p>⭐ 4.2</p>
      </div>

      {/* MODAL */}
      {open && (
        <div className="modal">
          <div className="modal-content">
            <h2>{item.name}</h2>
            <p><b>Chef:</b> {item.chefName}</p>
            <p>{item.description}</p>

            {item.type === "subscription" &&
              item.meals?.map((meal, i) => (
                <div key={i}>
                  {meal.categories.map((cat, j) => (
                    <p key={j}>
                      <b>{cat.name}:</b> {cat.options.join(", ")}
                    </p>
                  ))}
                </div>
              ))
            }

            <button onClick={() => setOpen(false)}>Close</button>
            <button>Add to Cart</button>
          </div>
        </div>
      )}
    </>
  );
}