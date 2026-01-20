import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as bootstrap from "bootstrap";

const { VITE_API_BASE: API_BASE, VITE_API_PATH: API_PATH } = import.meta.env;

// 助教補充 axios 建立設定 baseURL 後，打api 免寫 ${API_BASE} 這部分
// axios.create({ baseURL: API_BASE });

// 實作步驟安排
// a. 登入狀態檢查與權限驗證
// b. 產品新增 / 編輯 / 刪除按鈕
// c. 建立 Modal 表單
// d. 表單狀態管理
// e. CRUD API 串接
// f. 初始化設定

const INIT_TEMPLATE_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [],
};

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [templateProduct, setTemplateProduct] = useState(INIT_TEMPLATE_DATA);
  const [modalType, setModalType] = useState("");
  const productModalRef = useRef(null);

  const getProducts = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products`);
      setProducts(data.products);
    } catch (error) {
      console.log(error.response?.data.message);
    }
  };

  const updateProduct = async (id) => {
    let url = `${API_BASE}/api/${API_PATH}/admin/product`;
    let methods = 'post';

    if (modalType === 'edit') {
      url = url + `/${id}`;
      methods = 'put';
    }

    const productData = {
      data: {
        ...templateProduct,
        origin_price: Number(templateProduct.origin_price),
        price: Number(templateProduct.price),
        is_enabled: templateProduct.is_enabled ? 1 : 0,
        imagesUrl: [...templateProduct.imagesUrl.filter(url => url !== "")],
      }
    };

    try {
      const { data } = await axios[methods](url, productData);
      console.log(data);
      getProducts();
      closeModal();
    } catch (error) {
      console.log(error.response?.data.message);
    }
  };

  const delProduct = async (id) => {
    try {
      const { data } = await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`);
      console.log(data);
      getProducts();
      closeModal();
    } catch (error) {
      console.log(error.response?.data.message);
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((preData) => ({
      ...preData,
      [name]: value,
    }));
  };

  const handleModalInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setTemplateProduct((preData) => ({
      ...preData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // React 陣列和物件都要複製後再改，建立新物件 React 才會重新渲染
  const handleModalImageChange = (index, value) => {
    setTemplateProduct((preData) => {
      const newImage = [...preData.imagesUrl];
      newImage[index] = value;

      // 填寫最後一個空輸入框時，自動新增空白輸入框
      if (value !== "" && index === newImage.length - 1 && newImage.length < 5) {
        newImage.push('')
      }

      // 清空輸入框時，移除最後的空白輸入框
      if (value === "" && newImage.length > 1 && newImage[newImage.length - 1] === "") {
        newImage.pop();
      }

      return {
        ...preData,
        imagesUrl: newImage,
      }
    });
  };

  const handleAddImage = () => {
    setTemplateProduct((preData) => {
      const newImage = [...preData.imagesUrl];
      newImage.push('');
      return {
        ...preData,
        imagesUrl: newImage,
      }
    });
  };

  const handleRemoveImage = () => {
    setTemplateProduct((preData) => {
      const newImage = [...preData.imagesUrl];
      newImage.pop();

      return {
        ...preData,
        imagesUrl: newImage,
      }
    })
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault(); // 關閉 form onSubmit 預設事件 避免網頁刷新
      const { data } = axios.post(`${API_BASE}/admin/signin`, formData);
      // console.log('singIn', data);
      const { token, expired } = data;
      document.cookie = `hexToken=${token};expires=${new Date(expired)};`;
      axios.defaults.headers.common['Authorization'] = token;
      setIsAuth(true);
      getProducts();
    } catch (error) {
      setIsAuth(false);
      console.log(error.response?.data.message);
    }
  };
  
  useEffect(() => {
    // 方法一
    // const token = document.cookie.replace(/(?:(?:^|.*;\s*)hexToken\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    // 方法二
    const token = document.cookie.split("; ").find(row => row.startsWith('hexToken='))?.split("=")[1];
    if (token) axios.defaults.headers.common['Authorization'] = token;

    productModalRef.current = new bootstrap.Modal('#productModal', {
      keyboard: false,
    });

    const checkLogin = async () => {
      try {
        const { data } = await axios.post(`${API_BASE}/api/user/check`);
        setIsAuth(true);
        getProducts();
        console.log('checkLogin', data);
      } catch (error) {
        console.log(error.response?.data.message);
      }
    };

    checkLogin();
  }, []);

 

  const openModal = (type, product) => {
    // console.log(type, product)
    setModalType(type);
    setTemplateProduct((preData) => ({
      ...preData,
      ...product,
    }));
    productModalRef.current.show();
  };

  const closeModal = () => {
    productModalRef.current.hide();
  }
  






  return (<>
    {!isAuth ? (
      <div className="container login">
        <div className="row justify-content-center">
          <h1 className="h3 mb-3 font-weight-normal">請先登入</h1>
          <div className="col-8">
            <form id="form"  className="form-signin" onSubmit={(e) => handleSubmit(e)}>
              <div className="form-floating mb-3">
                <input
                  type="email"
                  className="form-control"
                  name="username"
                  placeholder="name@example.com"
                  value={formData.username}
                  onChange={(e) => handleInputChange(e)}
                  required
                  autoFocus
                />
                <label htmlFor="username">Email address</label>
              </div>
              <div className="form-floating">
                <input type="password"
                  className="form-control"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange(e)}
                  required 
                />
                <label htmlFor="password">Password</label>
              </div>
              <button
                className="btn btn-lg btn-primary w-100 mt-3"
                type="submit"
              >
                登入
              </button>
            </form>
          </div>
        </div>
        <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
      </div>
    ) : (
      <div className="container">
        <h2>產品列表</h2>
        <div className="text-end mt-4">
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => openModal('create', INIT_TEMPLATE_DATA)}>
            建立新的產品
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">分類</th>
              <th scope="col">產品名稱</th>
              <th scope="col">原價</th>
              <th scope="col">售價</th>
              <th scope="col">是否啟用</th>
              <th scope="col">編輯</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => (
                <tr key={item.id}>
                  <td>{item.category}</td>
                  {/* <td>{item.title}</td> */}
                  <th scope="row">{item.title}</th>
                  <td>{item.origin_price}</td>
                  <td>{item.price}</td>
                  <td className={`${item.is_enabled && 'text-success'}`}>{item.is_enabled ? "啟用" : "未啟用"}</td>
                  <td>
                    <div className="btn-group" role="group" aria-label="Basic example">
                      <button 
                        type="button" 
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => openModal('edit', item)}
                      >
                        編輯
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => openModal('delete', item)}
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    )}
    {/* Modal */}
    <div 
      className="modal fade" 
      id="productModal" 
      tabIndex="-1" 
      aria-labelledby="productModalLabel" 
      aria-hidden="true"
      ref={productModalRef}
    >
      <div className="modal-dialog modal-xl">
        <div className="modal-content border-0">
          <div className={`modal-header bg-${modalType === 'delete' ? 'danger' : 'dark'} text-white`}>
            <h5 id="productModalLabel" className="modal-title">
              <span>{modalType === 'delete' ? '刪除' : 
              modalType === 'edit' ? '編輯' : '新增'}</span>
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              data-bs-dismiss="modal"
              aria-label="Close"
              ></button>
          </div>
          
          <div className="modal-body">
            {
              modalType === 'delete' ? (
                <p className="fs-4">
                  確定要刪除
                  <span className="text-danger">{templateProduct.title}</span>嗎？
                </p>
              ) : (
                <div className="row">
                  <div className="col-sm-4">
                    <div className="mb-2">
                      <div className="mb-3">
                        <label htmlFor="imageUrl" className="form-label">
                          輸入圖片網址
                        </label>
                        <input
                          type="text"
                          id="imageUrl"
                          name="imageUrl"
                          className="form-control"
                          placeholder="請輸入圖片連結"
                          value={templateProduct.imageUrl}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                      {
                        templateProduct.imageUrl && (
                          <img className="img-fluid" src={templateProduct.imageUrl} alt="主圖" />
                      )}
                    </div>
                    <div>
                      {
                        templateProduct.imagesUrl.map((url, index) => (
                          <div key={index}>
                            <label htmlFor="imageUrl" className="form-label">
                              輸入圖片網址
                            </label>
                            <input 
                              type="text"
                              className="form-control"
                              placeholder={`圖片網址 ${index + 1}`}
                              value={url}
                              onChange={(e) => handleModalImageChange(index, e.target.value)}
                            />
                            {
                              url && (
                              <img 
                                className="img-fluid"
                                src={url}
                                alt={`副圖 ${index + 1}`}
                              />
                            )}
                          </div>
                        ))  
                      }
                      {
                        // 增加最多五張的限制，最後一個 input 有值才顯示新增按鈕(避免一直按新增)
                        templateProduct.imagesUrl.length < 5 &&
                        templateProduct.imagesUrl[templateProduct.imagesUrl.length - 1] !== "" && (
                        <button 
                          className="btn btn-outline-primary btn-sm d-block w-100"
                          onClick={() => handleAddImage()}
                        >
                          新增圖片
                        </button>)
                      }
                    </div>
                    <div>
                      {
                        // imagesUrl 陣列有值才顯示
                        templateProduct.imagesUrl.length >= 1 && (
                        <button 
                          className="btn btn-outline-danger btn-sm d-block w-100"
                          onClick={() => handleRemoveImage()}
                        >
                          刪除圖片
                        </button>)
                      }
                    </div>
                  </div>
                  <div className="col-sm-8">
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">標題</label>
                      <input
                        name="title"
                        id="title"
                        type="text"
                        className="form-control"
                        placeholder="請輸入標題"
                        value={templateProduct.title}
                        onChange={(e) => handleModalInputChange(e)}
                      />
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="category" className="form-label">分類</label>
                        <input
                          name="category"
                          id="category"
                          type="text"
                          className="form-control"
                          placeholder="請輸入分類"
                          value={templateProduct.category}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="unit" className="form-label">單位</label>
                        <input
                          name="unit"
                          id="unit"
                          type="text"
                          className="form-control"
                          placeholder="請輸入單位"
                          value={templateProduct.unit}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="origin_price" className="form-label">原價</label>
                        <input
                          name="origin_price"
                          id="origin_price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="請輸入原價"
                          value={templateProduct.origin_price}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="price" className="form-label">售價</label>
                        <input
                          name="price"
                          id="price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="請輸入售價"
                          value={templateProduct.price}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                    </div>
                    <hr />

                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">產品描述</label>
                      <textarea
                        name="description"
                        id="description"
                        className="form-control"
                        placeholder="請輸入產品描述"
                        value={templateProduct.description}
                        onChange={(e) => handleModalInputChange(e)}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="content" className="form-label">說明內容</label>
                      <textarea
                        name="content"
                        id="content"
                        className="form-control"
                        placeholder="請輸入說明內容"
                        value={templateProduct.content}
                        onChange={(e) => handleModalInputChange(e)}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          name="is_enabled"
                          id="is_enabled"
                          className="form-check-input"
                          type="checkbox"
                          checked={templateProduct.is_enabled}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                        <label className="form-check-label" htmlFor="is_enabled">
                          是否啟用
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          </div>
          <div className="modal-footer">
            {
              modalType === 'delete' ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => delProduct(templateProduct.id)}
                >
                刪除
                </button>
              ) : (
                <>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    data-bs-dismiss="modal"
                    onClick={() => closeModal()}
                  >
                    取消
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => updateProduct(templateProduct.id)}
                  >
                    確認
                  </button>
                </>
              )
            }
          </div>
        </div>
      </div>
    </div>
  </>);
};

export default App;
