<?php
namespace App\Controllers;

use App\Models\DBService;

class PopulateController {
    private $db;
    private $student_controller;

    public function __construct() {
        $this->db = new DBService();
        $this->student_controller = new StudentController();
    }

    function generateRandomStudent() {
        $groups = ['PZ-22', 'KN-11', 'PZ-31', 'PZ-14', 'KN-32', 'IR-22', 'IR-12', 'IR-21', 'IR-31', 'SA-22'];
        $firstNamesMale = ['Mykhailo', 'Oleksandr', 'Dmytro', 'Andrii', 'Bohdan', 'Maksym', 'Ivan', 'Tymofiy', 'Vladyslav', 'Yaroslav'];
        $firstNamesFemale = ['Sofiia', 'Mariia', 'Anastasiia', 'Yelyzaveta', 'Daryna', 'Kateryna', 'Valeriia', 'Oleksandra', 'Nataliia', 'Yeva'];
        $surnames = ['Shevchenko', 'Kovalenko', 'Bondarenko', 'Tkachenko', 'Kravchenko', 'Melnyk', 'Oliynyk', 'Kovalchuk', 'Lysenko', 'Romanenko'];
        $genders = ['Male', 'Female'];
        
        // Generate random attributes
        $group = $groups[array_rand($groups)];
        $gender = $genders[array_rand($genders)];
        
        // Select first name based on gender
        $firstName = ($gender === 'Male') ? $firstNamesMale[array_rand($firstNamesMale)] : $firstNamesFemale[array_rand($firstNamesFemale)];
        
        // Surnames may vary by gender in Ukrainian tradition
        $surname = $surnames[array_rand($surnames)];
        if ($gender === 'Female' && !str_ends_with($surname, 'enko')) {
            $surname = rtrim($surname, 'o') . 'a'; // Adjust for feminine form (e.g., Melnyk -> Melnyka)
        }
        
        // Generate random birthday (between 1995 and 2005 for student age range)
        $startDate = strtotime('1990-01-01');
        $endDate = strtotime('2010-12-31');
        $randomDate = rand($startDate, $endDate);
        $birthday = date('Y-m-d', $randomDate);
        
        return [
            'Group' => $group,
            'Name' => $firstName,
            'Surname' => $surname,
            'Gender' => $gender,
            'Birthday' => $birthday
        ];
    }

    // Function to generate multiple random students
    function generateRandomStudents($count) {
        $students = [];
        for ($i = 0; $i < $count; $i++) {
            $students[] = $this->generateRandomStudent();
        }
        return $students;
    }

    // Function to populate students using create_student method
    function populate_students($count) {
        $students = $this->generateRandomStudents($count);
        $successCount = 0;
        $errors = [];

        foreach ($students as $student) {
            // Call the create_student method and capture the response
            $response = $this->student_controller->create_student($student);
            $responseData = json_decode($response, true);

            // Check the response status
            if (http_response_code() === 201) {
                $successCount++;
            } else {
                $errorMsg = isset($responseData['error']) ? $responseData['error'] : 'Unknown error';
                $errors[] = "Failed to create student: {$student['Name']} {$student['Surname']} - $errorMsg";
            }
        }

        // Output the results
        echo "Processed $count students. Successfully created: $successCount\n";
        if (!empty($errors)) {
            echo "Errors encountered:\n";
            foreach ($errors as $error) {
                echo "$error\n";
            }
        }
    }
}
?>