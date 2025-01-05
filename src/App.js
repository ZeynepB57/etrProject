import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [accounts, setAccounts] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});

  const completeGroups = (data) => {
    const tempData = [...data];

    data.forEach((item) => {
      const code = item.account_code;

      const parent3 = code.slice(0, 3);
      if (!tempData.some((d) => d.account_code === parent3) && code.length > 3) {
        tempData.push({
          account_code: parent3,
          account_balance: 0,
        });
      }

      if (code.length > 3) {
        const parent6 = code.slice(0, 6);
        if (!tempData.some((d) => d.account_code === parent6) && code.length > 6) {
          tempData.push({
            account_code: parent6,
            account_balance: 0,
          });
        }
      }
    });

    return tempData;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await axios.get('https://etrproject-backend.onrender.com/api/accounts');
        const completedData = completeGroups(result.data);
        setAccounts(completedData);
      } catch (error) {
        console.error('Veri çekme hatası:', error);
      }
    };

    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const groupData = (data, length, filterLength) => {
    const grouped = {};
    data.forEach((item) => {
      if (item.account_code.length === length) {
        const key = item.account_code.slice(0, filterLength);
        if (!grouped[key]) {
          grouped[key] = { items: [], totalBalance: 0 };
        }
        grouped[key].items.push(item);
        grouped[key].totalBalance += parseFloat(item.account_balance);
      }
    });
    return grouped;
  };

  const calculateParentBalances = (childGrouped, parentGrouped, parentLength) => {
    Object.keys(parentGrouped).forEach((parentKey) => {
      parentGrouped[parentKey].totalBalance = Object.keys(childGrouped)
        .filter((childKey) => childKey.startsWith(parentKey))
        .reduce((sum, childKey) => sum + childGrouped[childKey].totalBalance, 0);
    });
  };

  const groupedBy3 = groupData(accounts, 3, 3);
  const groupedBy6 = groupData(accounts, 6, 6);
  const groupedBy11 = groupData(accounts, 11, 11);

  calculateParentBalances(groupedBy11, groupedBy6, 6);
  calculateParentBalances(groupedBy6, groupedBy3, 3);

  const handleExpand = (key) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div>
      <h1>Hesap Raporu</h1>
      <table border="1">
        <thead>
          <tr>
            <th></th>
            <th>Hesap Kodu</th>
            <th>Toplam Borç</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedBy3).map(([key3, group3]) => (
            <React.Fragment key={key3}>
              <tr>
                <td>
                  <button onClick={() => handleExpand(key3)}>
                    {expandedGroups[key3] ? '−' : '+'}
                  </button>
                </td>
                <td>{key3}</td>
                <td>{group3.totalBalance.toFixed(2)} ₺</td>
              </tr>

              {expandedGroups[key3] &&
                Object.entries(groupedBy6).map(([key6, group6]) => {
                  if (key6.startsWith(key3)) {
                    return (
                      <React.Fragment key={key6}>
                        <tr>
                          <td>
                            <button onClick={() => handleExpand(key6)}>
                              {expandedGroups[key6] ? '−' : '+'}
                            </button>
                          </td>
                          <td>{key6}</td>
                          <td>{group6.totalBalance.toFixed(2)} ₺</td>
                        </tr>

                        {expandedGroups[key6] &&
                          Object.entries(groupedBy11).map(([key11, group11]) => {
                            if (key11.startsWith(key6)) {
                              return (
                                <tr key={key11}>
                                  <td></td>
                                  <td>{key11}</td>
                                  <td>{group11.totalBalance.toFixed(2)} ₺</td>
                                </tr>
                              );
                            }
                            return null;
                          })}
                      </React.Fragment>
                    );
                  }
                  return null;
                })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;