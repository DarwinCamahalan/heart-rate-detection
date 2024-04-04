import React from 'react';
import styles from './patientForm.module.scss';

const PatientForm = ({
  firstName,
  lastName,
  age,
  birthday,
  gender,
  email,
  accountCreationInfo,
  uid,
  role,
  formError,
  setFirstName,
  setLastName,
  setAge,
  setBirthday,
  setGender,
  handleSubmit,
  handleKeyDown
}) => {
  const handleAgeChange = (e) => {
    // Ensure age is a non-negative number
    const inputAge = parseInt(e.target.value);
    if (!isNaN(inputAge) && inputAge >= 0) {
      setAge(inputAge);
    }
  };

  const handleNameChange = (e, setter) => {
    // Ensure only alphabets and spaces are entered for first and last name
    const name = e.target.value.replace(/[^A-Za-z\s]/g, '');
    setter(name);
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.informationForm}>
        <div className={styles.formControl}>
          <div className={styles.activeForm}>
            <h2>Complete Profile</h2>
            <input type="text" placeholder="First Name" value={firstName} onChange={(e) => handleNameChange(e, setFirstName)} onKeyDown={handleKeyDown} />
            <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => handleNameChange(e, setLastName)} onKeyDown={handleKeyDown} />
            <input type="number" placeholder="Age" value={age} onChange={handleAgeChange} onKeyDown={handleKeyDown} />
            <input type="date" placeholder="Birthday" value={birthday} onChange={(e) => setBirthday(e.target.value)} onKeyDown={handleKeyDown} />
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className={styles.disabledForm}>
            <h2>Additional Information</h2>
            <input type="text" value={`Email: ${email}`} disabled />
            <input type="text" value={`Account Created: ${accountCreationInfo}`} disabled />
            <input type="text" value={`UID: ${uid}`} disabled />
            <input type="text" value={`Role: ${role}`} disabled />
          </div>
        </div>
        {formError && <p className={styles.errorMsg}>{formError}</p>}
        <button onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
};

export default PatientForm;
