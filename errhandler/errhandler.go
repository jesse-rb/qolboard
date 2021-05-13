package errhandler

import "log"
import "fmt"

// HandleGenErr : Handle a general error, returns true if ok, else returns false
func HandleGenErr(desc string, err error) bool {
	if (err != nil) {
		log.Println(desc, err)
		return false
	}
	return true;
}

// ErrorCustom : Error custom
func ErrorCustom() error {
	return fmt.Errorf("ErrorCustom")
}