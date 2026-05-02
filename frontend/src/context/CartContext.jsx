import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {

  // 🔥 NEW STRUCTURE
  const [cart, setCart] = useState({
    daily: { items: [], chefId: null },
    subscription: { items: [], chefId: null },
    ready: { items: [] }
  });

  // ➕ ADD TO CART
  const addToCart = (item) => {
    const type = item.type; // daily | subscription | ready

    setCart(prev => {
      const section = prev[type];

      // 🔒 Chef restriction (only for daily + subscription)
      if (type !== "ready") {
        if (section.chefId && section.chefId !== item.chefId) {
          alert("Different chef detected. Clearing previous items...");

          return {
            ...prev,
            [type]: {
              chefId: item.chefId,
              items: [{ ...item, quantity: 1 }]
            }
          };
        }
      }

      const existing = section.items.find(i => i._id === item._id);

      // 🔁 Increase quantity
      if (existing) {
        return {
          ...prev,
          [type]: {
            ...section,
            items: section.items.map(i =>
              i._id === item._id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          }
        };
      }

      // 🆕 Add new item
      return {
        ...prev,
        [type]: {
          chefId: type === "ready" ? null : item.chefId,
          items: [...section.items, { ...item, quantity: 1 }]
        }
      };
    });
  };

  // ❌ REMOVE ITEM
  const removeFromCart = (type, id) => {
    setCart(prev => {
      const updatedItems = prev[type].items.filter(i => i._id !== id);

      return {
        ...prev,
        [type]: {
          items: updatedItems,
          chefId: updatedItems.length ? prev[type].chefId : null
        }
      };
    });
  };

  // 🧹 CLEAR CART (ALL)
  const clearCart = () => {
    setCart({
      daily: { items: [], chefId: null },
      subscription: { items: [], chefId: null },
      ready: { items: [] }
    });
  };

  // 💰 TOTAL (ALL)
  const total =
    [...cart.daily.items, ...cart.subscription.items, ...cart.ready.items]
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 🔢 COUNT (for navbar)
  const count =
    cart.daily.items.length +
    cart.subscription.items.length +
    cart.ready.items.length;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        total,
        count
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// 🔥 HOOK
export const useCart = () => useContext(CartContext);