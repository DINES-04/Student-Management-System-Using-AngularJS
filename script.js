var app = angular.module("studentApp", ["ngRoute"]);

app.config(function ($routeProvider) {
  $routeProvider
    .when("/login", {
      templateUrl: "login.html",
      controller: "AuthController",
    })
    .when("/register", {
      templateUrl: "register.html",
      controller: "AuthController",
    })
    .when("/dashboard", {
      templateUrl: "dashboard.html",
      controller: "StudentController",
    })
    .when("/forget-password", {
      templateUrl: "forget-password.html",
      controller: "AuthController",
    })
    .when("/student-list", {
      templateUrl: "student-list.html",
      controller: "StudentController",
    })
    .otherwise({
      redirectTo: "/login",
    });
});

// SHA-256 hash (basic)
function sha256(str) {
  return crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(str))
    .then((buf) =>
      Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
}

app.controller("AuthController", function ($scope, $location) {
  const getUsers = () => JSON.parse(localStorage.getItem("users") || "[]");

  $scope.register = {};
  $scope.login = {};
  $scope.errorMessage = "";

  $scope.registerUser = function () {
    const users = getUsers();
    if (users.find((u) => u.username === $scope.register.username)) {
      alert("User already exists!");
      return;
    }
    sha256($scope.register.password).then((hash) => {
      users.push({
        username: $scope.register.username,
        password: hash,
        role: $scope.register.role,
      });
      localStorage.setItem("users", JSON.stringify(users));
      alert("Registration successful!");
      $location.path("/login");
      $scope.$apply();
    });
  };

  $scope.loginUser = function () {
    const users = getUsers();
    sha256($scope.login.password).then((hash) => {
      const user = users.find(
        (u) => u.username === $scope.login.username && u.password === hash
      );
      if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user));
        $location.path("/dashboard");
        $scope.$apply();
      } else {
        $scope.errorMessage = "Invalid credentials!";
        $scope.$apply();
      }
    });
  };
  $scope.showReset = false;
  $scope.resetMessage = "";

  $scope.resetPassword = function () {
    let users = JSON.parse(localStorage.getItem("users") || "[]");
    let userIndex = users.findIndex((u) => u.username === $scope.resetUsername);

    if (userIndex === -1) {
      $scope.resetMessage = "User not found!";
      return;
    }

    sha256($scope.newPassword).then((hash) => {
      users[userIndex].password = hash;
      localStorage.setItem("users", JSON.stringify(users));
      $scope.resetMessage = "Password successfully reset!";
      $scope.resetUsername = "";
      $scope.newPassword = "";
      $scope.$apply();
    });
    $location.path("/login");
  };
});

app.controller("StudentController", function ($scope, $location) {
  $scope.currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!$scope.currentUser) {
    $location.path("/login");
    return;
  }

  const loadStudents = () =>
    JSON.parse(localStorage.getItem("students") || "[]");
  const saveStudents = () =>
    localStorage.setItem("students", JSON.stringify($scope.students));

  $scope.students = loadStudents();
  $scope.newStudent = {};

  $scope.addStudent = function () {
    const duplicate = $scope.students.some(
      (student) => student.rollNumber === $scope.newStudent.rollNumber
    );

    if (duplicate) {
      alert("Roll Number already exists! Please use a unique Roll Number.");
      return;
    }

    $scope.students.push(angular.copy($scope.newStudent));
    saveStudents();
    $scope.newStudent = {};
    alert("Student added successfully!");
  };

  $scope.editStudent = function (index) {
    const updatedName = prompt("Enter new name", $scope.students[index].name);
    const updatedDept = prompt(
      "Enter new department",
      $scope.students[index].department
    );
    if (updatedName && updatedDept) {
      $scope.students[index].name = updatedName;
      $scope.students[index].department = updatedDept;
      saveStudents();
    }
  };

  $scope.deleteStudent = function (index) {
    if (confirm("Are you sure you want to delete this student?")) {
      $scope.students.splice(index, 1);
      saveStudents();
    }
  };

  $scope.logout = function () {
    localStorage.removeItem("currentUser");
    $location.path("/login");
  };
  $scope.sortKey = "rollNumber";
  $scope.reverseSort = false;

  $scope.sortBy = function (key) {
    if ($scope.sortKey === key) {
      $scope.reverseSort = !$scope.reverseSort;
    } else {
      $scope.sortKey = key;
      $scope.reverseSort = false;
    }
  };
});
