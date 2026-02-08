//updateDate
import axios from 'axios';
import { showAlert } from './alert';

//Type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
   const url =
     type === 'password'
       ? 'http://127.0.0.1:8000/api/v1/users/updateMyPassword'
       : 'http://127.0.0.1:8000/api/v1/users/updateMe';
    const res = await axios({
      //axios return a promis, and when ever there are an error axios will throght the error
      method: 'PATCH',
      url,
      data
    });

    if (res.data.status === 'Success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
      // window.setTimeout(() => {
      //   location.assign('/me'); //We use this in order to load another page
      // }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
