import React, { useState, useContext, useEffect } from "react";
import { signOut } from "firebase/auth";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  FlatList,
  Button,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TaskCard, TaskForm } from "../components";
import { auth, db } from "../config";
import { AuthenticatedUserContext } from "../providers";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  setDoc,
  getDoc,
  increment,
} from "firebase/firestore";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return weekNo;
}

const TasksScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [isFormVisible, setFormVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const { user } = useContext(AuthenticatedUserContext);

  useEffect(() => {
    console.log("UID ----------", user.uid);
    const userTasksQuery = query(
      collection(db, "tasks"),
      where("uid", "==", user.uid),
      where("completed", "==", false)
    );

    const completedTasksQuery = query(
      collection(db, "tasks"),
      where("uid", "==", user.uid),
      where("completed", "==", true),
      orderBy("completedAt", "desc")
    );

    const unsubscribeTasks = onSnapshot(userTasksQuery, (querySnapshot) => {
      const fetchedTasks = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setTasks(fetchedTasks);
    });

    const unsubscribeCompletedTasks = onSnapshot(
      completedTasksQuery,
      (querySnapshot) => {
        const fetchedCompletedTasks = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setCompletedTasks(fetchedCompletedTasks);
      }
    );

    return () => {
      unsubscribeTasks();
      unsubscribeCompletedTasks();
    };
  }, [user.uid]);

  const handleAddOrUpdateTask = async (taskDetails) => {
    try {
      if (selectedTask) {
        await updateDoc(doc(db, "tasks", selectedTask.id), {
          title: taskDetails.title,
          description: taskDetails.details,
          dueDate: taskDetails.dueDate.toISOString(),
          priority: taskDetails.priority,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addDoc(collection(db, "tasks"), {
          uid: user.uid,
          title: taskDetails.title,
          description: taskDetails.details,
          dueDate: taskDetails.dueDate.toISOString(),
          priority: taskDetails.priority,
          createdAt: new Date().toISOString(),
          completed: false,
        });

        //updateLeaderboards(user.uid);
      }
      setFormVisible(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error adding/updating task: ", error);
      throw error;
    }
  };

  const updateLeaderboards = async (userId) => {
    console.log("Updating leaderboards ----");
    const now = new Date();
    const year = now.getFullYear();
    const weekNumber = getWeekNumber(now); // Function to calculate the week number of the year
    const dayFormat = `${now.getFullYear()}-${
      now.getMonth() + 1
    }-${now.getDate()}`; // Formats date as 'YYYY-M-D'

    const dayLeaderboardRef = doc(
      db,
      "leaderboards",
      `leaderboard-day-${dayFormat}`
    );
    const weekLeaderboardRef = doc(
      db,
      "leaderboards",
      `leaderboard-week-${year}-${weekNumber}`
    );
    const yearLeaderboardRef = doc(
      db,
      "leaderboards",
      `leaderboard-month-${year}-${now.getMonth() + 1}`
    );

    // Prepare the updates for each leaderboard
    const updates = {
      [`counts.${userId}`]: increment(1),
      // Initialize or update the date field for reference
      date: now.toISOString().split("T")[0],
    };

    // Use setDoc with { merge: true } to create or update the daily leaderboard
    await setDoc(dayLeaderboardRef, updates, { merge: true });

    // Use setDoc with { merge: true } to create or update the weekly leaderboard
    await setDoc(weekLeaderboardRef, updates, { merge: true });

    // Use setDoc with { merge: true } to create or update the yearly leaderboard
    await setDoc(yearLeaderboardRef, updates, { merge: true });
  };

  // Function to get the ISO week number

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        completed: true,
        completedAt: new Date().toISOString(),
      });

      // Update user's completed tasks count
      updateLeaderboards(user.uid);
    } catch (error) {
      console.error("Error completing task: ", error);
    }
  };

  const openTaskForm = (task = null) => {
    setSelectedTask(task);
    setFormVisible(true);
  };

  const getTaskColor = (priority) => {
    switch (priority) {
      case "High":
        return "#FFCCCB";
      case "Mid":
        return "#FFFACD";
      case "Low":
        return "#E0FFFF";
      default:
        return "#FFFFFF";
    }
  };

  const renderRightActions = (taskId) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDeleteTask(taskId)}
      >
        <Text style={styles.actionText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  const renderLeftActions = (taskId) => {
    return (
      <TouchableOpacity
        style={styles.completeAction}
        onPress={() => handleCompleteTask(taskId)}
      >
        <Text style={styles.actionText}>Complete</Text>
      </TouchableOpacity>
    );
  };

  const handleLogout = () => {
    signOut(auth).catch((error) => console.log("Error logging out: ", error));
  };

  return (
    <>
      <View>
        <Button title="Sign Out" onPress={handleLogout} />
      </View>
      <View style={styles.container}>
        <ScrollView>
          <Text style={styles.sectionTitle}>Active Tasks</Text>
          {tasks.map((task) => (
            <Swipeable
              key={task.id}
              renderRightActions={() => renderRightActions(task.id)}
              renderLeftActions={() => renderLeftActions(task.id)}
            >
              <TaskCard
                title={task.title}
                dueDate={task.dueDate}
                priority={task.priority}
                color={getTaskColor(task.priority)}
                onPress={() => openTaskForm(task)}
              />
            </Swipeable>
          ))}
          <Text style={styles.sectionTitle}>Completed Tasks</Text>
          {completedTasks.map((task) => (
            <TaskCard
              key={task.id}
              title={task.title}
              dueDate={task.completedAt}
              priority={task.priority}
              color={getTaskColor(task.priority)}
              onPress={() => {}} // Disabled for completed tasks
            />
          ))}
        </ScrollView>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openTaskForm()}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
        <TaskForm
          isVisible={isFormVisible}
          onClose={() => {
            setFormVisible(false);
            setSelectedTask(null);
          }}
          onSubmit={handleAddOrUpdateTask}
          initialValues={selectedTask}
        />
      </View>
    </>
  );
};

const LeaderboardScreen = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [timeRange, setTimeRange] = useState("day");
  console.log("rendering leaderboard screen -----");

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      const year = today.getFullYear();
      const weekNumber = getWeekNumber(today);
      const dateFormatted = `${today.getFullYear()}-${
        today.getMonth() + 1
      }-${today.getDate()}`;

      let docId;
      if (timeRange === "day") {
        docId = `leaderboard-day-${dateFormatted}`;
      } else if (timeRange === "week") {
        docId = `leaderboard-week-${year}-${weekNumber}`;
      } else if (timeRange === "month") {
        docId = `leaderboard-month-${year}-${today.getMonth() + 1}`;
      }

      const leaderboardRef = doc(db, "leaderboards", docId);
      const docSnapshot = await getDoc(leaderboardRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const leaderboardMap = Object.keys(data)
          .filter((key) => key.startsWith("counts."))
          .reduce((obj, key) => {
            // Extract the UID and count from the key
            const uid = key.split(".")[1];
            obj[uid] = data[key];
            return obj;
          }, {});

        const users = Object.keys(leaderboardMap).map((userId) => ({
          id: userId,
          completedTasks: leaderboardMap[userId],
        }));

        //console log entire users
        console.log(users);
        setLeaderboardData(
          users.sort((a, b) => b.completedTasks - a.completedTasks)
        );
      } else {
        setLeaderboardData([]); // Handle cases where no data is available
      }
    };

    fetchData();
  }, [timeRange]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: "#f0f0f0",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
    },
    picker: {
      height: 50,
      marginBottom: 20,
    },
    card: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: "#ffffff",
      borderRadius: 8,
      padding: 15,
      marginVertical: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    cardText: {
      fontSize: 18,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      <Picker
        selectedValue={timeRange}
        style={styles.picker}
        onValueChange={(newRange) => setTimeRange(newRange)}
      >
        <Picker.Item label="Day" value="day" />
        <Picker.Item label="Week" value="week" />
        <Picker.Item label="Month" value="month" />
      </Picker>
      <FlatList
        data={leaderboardData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardText}>{item.id}</Text>
            <Text style={styles.cardText}>{item.completedTasks}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default LeaderboardScreen;

export const HomeScreen = () => {
  console.log("rendering home screen -----");
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconComponent;

          if (route.name === "My Tasks") {
            iconComponent = (
              <FontAwesome5 name="tasks" size={size} color={color} />
            );
          } else if (route.name === "Leaderboard") {
            iconComponent = (
              <MaterialIcons name="leaderboard" size={size} color={color} />
            );
          }

          return iconComponent;
        },
        tabBarActiveTintColor: "tomato",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: { paddingBottom: 10 }, // Adding padding at the bottom
      })}
    >
      <Tab.Screen name="My Tasks" component={TasksScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
    </Tab.Navigator>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F5F5F5",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#8A2BE2",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  addButtonText: {
    fontSize: 30,
    color: "white",
  },
  deleteAction: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "flex-end",
    padding: 20,
    height: "85%",
    borderRadius: 8,
  },
  completeAction: {
    backgroundColor: "green",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 20,
    height: "85%",
    borderRadius: 8,
  },
  actionText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  picker: {
    height: 50,
    width: 150,
    marginBottom: 20,
  },
  leaderboardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  rank: {
    fontSize: 18,
    fontWeight: "bold",
    width: 30,
  },
  name: {
    fontSize: 16,
    flex: 1,
  },
  score: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
