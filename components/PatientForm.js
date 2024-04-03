import React from 'react';

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
  handleSubmit
}) => {
  return (
    <>
      <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
      <input type="date" placeholder="Birthday" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
      <select value={gender} onChange={(e) => setGender(e.target.value)}>
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      <input type="text" value={`Email: ${email}`} disabled />
      <input type="text" value={`Account Created: ${accountCreationInfo}`} disabled />
      <input type="text" value={`UID: ${uid}`} disabled />
      <input type="text" value={`Role: ${role}`} disabled />
      {formError && <p>{formError}</p>}
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
};

export default PatientForm;
