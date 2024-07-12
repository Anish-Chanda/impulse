import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import DateTimePicker from "@react-native-community/datetimepicker";

const PriorityButton = ({ priority, selected, onSelect }) => (
  <TouchableOpacity
    style={[styles.priorityButton, selected && styles.selectedPriority]}
    onPress={() => onSelect(priority)}
  >
    <Text
      style={[styles.priorityText, selected && styles.selectedPriorityText]}
    >
      {priority}
    </Text>
  </TouchableOpacity>
);

const TaskForm = ({ isVisible, onClose, onSubmit, initialValues = null }) => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [priority, setPriority] = useState("Mid");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (initialValues) {
      setDate(new Date(initialValues.dueDate));
      setPriority(initialValues.priority);
    }
  }, [initialValues]);

  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Task name is required"),
    details: Yup.string().max(275, "Details must be 275 characters or less"),
  });

  const handleConfirmDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>
            {initialValues ? "Update Task" : "New Task"}
          </Text>
          <Formik
            initialValues={initialValues || { title: "", details: "" }}
            validationSchema={validationSchema}
            onSubmit={(values, { setSubmitting }) => {
              setFormError("");
              try {
                onSubmit({ ...values, dueDate: date, priority });
                setSubmitting(false);
              } catch (error) {
                setFormError("An error occurred. Please try again.");
                setSubmitting(false);
              }
            }}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              isSubmitting,
            }) => (
              <>
                <TextInput
                  style={styles.input}
                  onChangeText={handleChange("title")}
                  onBlur={handleBlur("title")}
                  value={values.title}
                  placeholder="Task name*"
                  placeholderTextColor="#666"
                />
                {touched.title && errors.title && (
                  <Text style={styles.errorText}>{errors.title}</Text>
                )}

                <Text style={styles.label}>Task details (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  onChangeText={handleChange("details")}
                  onBlur={handleBlur("details")}
                  value={values.details}
                  placeholder="Add task details..."
                  placeholderTextColor="#666"
                  multiline
                />
                {touched.details && errors.details && (
                  <Text style={styles.errorText}>{errors.details}</Text>
                )}
                <Text style={styles.charCount}>
                  {values.details
                    ? `${values.details.length}/275 characters`
                    : "0/275 characters"}
                </Text>

                <View style={styles.priorityContainer}>
                  <Text style={styles.label}>Priority:</Text>
                  <View style={styles.priorityButtons}>
                    {["Low", "Mid", "High"].map((p) => (
                      <PriorityButton
                        key={p}
                        priority={p}
                        selected={priority === p}
                        onSelect={setPriority}
                      />
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    Due Date: {date.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={handleConfirmDate}
                  />
                )}

                {formError !== "" && (
                  <Text style={styles.formErrorText}>{formError}</Text>
                )}

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onClose}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      isSubmitting && styles.disabledButton,
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.buttonText}>
                      {isSubmitting
                        ? "Saving..."
                        : initialValues
                        ? "Update task"
                        : "Add task"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Formik>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: "#f0f0f0",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  charCount: {
    alignSelf: "flex-end",
    color: "#666",
    marginBottom: 10,
  },
  priorityContainer: {
    marginBottom: 20,
  },
  priorityButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priorityButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedPriority: {
    backgroundColor: "#8A2BE2",
  },
  priorityText: {
    color: "#333",
  },
  selectedPriorityText: {
    color: "white",
  },
  dateButton: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  dateButtonText: {
    color: "#333",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#ddd",
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: "center",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#8A2BE2",
    padding: 15,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 5,
  },
});

export default TaskForm;
