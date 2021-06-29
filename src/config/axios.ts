import axios from 'axios';
import { extraLog } from "./winston"

axios.interceptors.request.use(function (req) {
    extraLog.info({ message: `${req.method} - ${req.baseURL} - ${req.url}`, data: { params: req.params, headers: req.headers, body: req.data } })
    return req;
}, function (error) {
    return Promise.reject(error);
});

axios.interceptors.response.use(function (response) {
    extraLog.info({ message: `${response.status} - ${response.statusText}`, data: response.data, config: response.config })
    return response;
}, function (error) {
    extraLog.info({ message: `ERROR!!`, data: error })
    return Promise.reject(error);
});

export default axios;